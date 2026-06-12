import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, Role } from '@kitchenledger/db';
import { AuditService } from '../audit/audit.service';
import { hashPassword, normalizeEmail } from '../auth/auth.helpers';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/types/tenant-context.type';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import {
  assertActorCanAssignRole,
  assertActorCanManageTarget,
  requiresBranchAssignment,
} from './team-role.rules';

const branchSummarySelect = {
  id: true,
  name: true,
  code: true,
} satisfies Prisma.BranchSelect;

type MembershipWithUser = Prisma.OrganizationMemberGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        lastLoginAt: true;
        branchMembers: {
          select: {
            branch: {
              select: typeof branchSummarySelect;
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenant: TenantContext) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { organizationId: tenant.organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            branchMembers: {
              where: { organizationId: tenant.organizationId },
              select: {
                branch: {
                  select: branchSummarySelect,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((membership) => this.mapMember(membership));
  }

  async create(tenant: TenantContext, dto: CreateTeamMemberDto) {
    assertActorCanAssignRole(tenant.role, dto.role);
    await this.validateBranchIdsForRole(
      tenant.organizationId,
      dto.role,
      dto.branchIds,
    );

    const email = normalizeEmail(dto.email);

    const result = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (user) {
        const existingMembership = await tx.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: tenant.organizationId,
            },
          },
        });

        if (existingMembership) {
          throw new ConflictException(
            'User is already a member of this organization',
          );
        }

        const passwordHash = await hashPassword(dto.password);
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
          },
        });
      } else {
        const passwordHash = await hashPassword(dto.password);
        user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
          },
        });
      }

      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: tenant.organizationId,
          role: dto.role,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              lastLoginAt: true,
              branchMembers: {
                where: { organizationId: tenant.organizationId },
                select: {
                  branch: {
                    select: branchSummarySelect,
                  },
                },
              },
            },
          },
        },
      });

      await this.syncBranchMembers(
        tx,
        user.id,
        tenant.organizationId,
        dto.role,
        dto.branchIds,
      );

      const refreshed = await tx.organizationMember.findUniqueOrThrow({
        where: { id: membership.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              lastLoginAt: true,
              branchMembers: {
                where: { organizationId: tenant.organizationId },
                select: {
                  branch: {
                    select: branchSummarySelect,
                  },
                },
              },
            },
          },
        },
      });

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.CREATE,
          entityType: 'TeamMember',
          entityId: refreshed.id,
          entityLabel: refreshed.user.email,
          after: this.teamMemberAuditSnapshot(refreshed),
        },
        tx,
      );

      return refreshed;
    });

    return this.mapMember(result);
  }

  async update(
    tenant: TenantContext,
    membershipId: string,
    dto: UpdateTeamMemberDto,
  ) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        id: membershipId,
        organizationId: tenant.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            branchMembers: {
              where: { organizationId: tenant.organizationId },
              select: {
                branch: {
                  select: branchSummarySelect,
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Team member not found');
    }

    const isSelf = membership.id === tenant.membershipId;

    assertActorCanManageTarget(tenant.role, membership.role);

    if (isSelf && dto.role !== undefined) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (isSelf && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own membership');
    }

    if (dto.role !== undefined) {
      assertActorCanAssignRole(tenant.role, dto.role);
    }

    const beforeSnapshot = this.teamMemberAuditSnapshot(membership);
    const effectiveRole = dto.role ?? membership.role;
    const shouldSyncBranches =
      dto.branchIds !== undefined || dto.role !== undefined;

    if (shouldSyncBranches) {
      const branchIdsForValidation =
        dto.branchIds ??
        (requiresBranchAssignment(effectiveRole)
          ? membership.user.branchMembers.map((item) => item.branch.id)
          : undefined);

      await this.validateBranchIdsForRole(
        tenant.organizationId,
        effectiveRole,
        dto.branchIds,
        branchIdsForValidation,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.organizationMember.update({
        where: { id: membership.id },
        data: {
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (shouldSyncBranches) {
        const branchIdsToSync = this.resolveBranchIdsForSync(
          effectiveRole,
          dto.branchIds,
          membership.user.branchMembers.map((item) => item.branch.id),
        );

        await this.syncBranchMembers(
          tx,
          membership.userId,
          tenant.organizationId,
          effectiveRole,
          branchIdsToSync,
        );
      }

      const refreshed = await tx.organizationMember.findUniqueOrThrow({
        where: { id: membership.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              lastLoginAt: true,
              branchMembers: {
                where: { organizationId: tenant.organizationId },
                select: {
                  branch: {
                    select: branchSummarySelect,
                  },
                },
              },
            },
          },
        },
      });

      const afterSnapshot = this.teamMemberAuditSnapshot(refreshed);
      let action: AuditAction = AuditAction.UPDATE;
      if (dto.isActive === false && membership.isActive) {
        action = AuditAction.DEACTIVATE;
      } else if (dto.isActive === true && !membership.isActive) {
        action = AuditAction.ACTIVATE;
      }

      await this.auditService.logFromTenant(
        tenant,
        {
          action,
          entityType: 'TeamMember',
          entityId: refreshed.id,
          entityLabel: refreshed.user.email,
          before: beforeSnapshot,
          after: afterSnapshot,
        },
        tx,
      );

      return refreshed;
    });

    return this.mapMember(updated);
  }

  private teamMemberAuditSnapshot(
    membership: Pick<MembershipWithUser, 'role' | 'isActive'> & {
      user: MembershipWithUser['user'];
    },
  ) {
    return this.auditService.sanitizeBeforeAfter({
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      role: membership.role,
      isActive: membership.isActive,
      branchIds: membership.user.branchMembers.map((item) => item.branch.id),
    });
  }

  private mapMember(membership: MembershipWithUser) {
    const { user } = membership;

    return {
      userId: user.id,
      membershipId: membership.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: membership.role,
      isActive: membership.isActive,
      branches: user.branchMembers.map((item) => item.branch),
      createdAt: membership.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private resolveBranchIdsForSync(
    role: Role,
    branchIds: string[] | undefined,
    existingBranchIds: string[],
  ): string[] | undefined {
    if (branchIds !== undefined) {
      return branchIds;
    }

    if (requiresBranchAssignment(role)) {
      return existingBranchIds;
    }

    return [];
  }

  private async validateBranchIdsForRole(
    organizationId: string,
    role: Role,
    branchIds: string[] | undefined,
    fallbackBranchIds?: string[],
  ) {
    const effectiveBranchIds = branchIds ?? fallbackBranchIds ?? [];

    if (requiresBranchAssignment(role)) {
      if (effectiveBranchIds.length === 0) {
        throw new BadRequestException(
          'At least one branch is required for this role',
        );
      }

      await this.assertBranchesBelongToOrg(organizationId, effectiveBranchIds);
      return;
    }

    if (branchIds && branchIds.length > 0) {
      await this.assertBranchesBelongToOrg(organizationId, branchIds);
    }
  }

  private async assertBranchesBelongToOrg(
    organizationId: string,
    branchIds: string[],
  ) {
    const uniqueIds = [...new Set(branchIds)];

    const branches = await this.prisma.branch.findMany({
      where: {
        organizationId,
        id: { in: uniqueIds },
        isActive: true,
      },
      select: { id: true },
    });

    if (branches.length !== uniqueIds.length) {
      throw new BadRequestException('One or more branches not found');
    }
  }

  private async syncBranchMembers(
    tx: Prisma.TransactionClient,
    userId: string,
    organizationId: string,
    role: Role,
    branchIds: string[] | undefined,
  ) {
    await tx.branchMember.deleteMany({
      where: { userId, organizationId },
    });

    if (!requiresBranchAssignment(role)) {
      if (!branchIds || branchIds.length === 0) {
        return;
      }
    }

    const uniqueIds = [...new Set(branchIds ?? [])];
    if (uniqueIds.length === 0) {
      return;
    }

    await tx.branchMember.createMany({
      data: uniqueIds.map((branchId) => ({
        branchId,
        userId,
        organizationId,
      })),
    });
  }
}
