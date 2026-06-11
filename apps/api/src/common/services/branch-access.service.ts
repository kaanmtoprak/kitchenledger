import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@kitchenledger/db';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../types/tenant-context.type';

export type AccessibleBranches = string[] | 'all';

@Injectable()
export class BranchAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isOrgWideAccess(role: Role): boolean {
    return role === Role.OWNER || role === Role.ADMIN;
  }

  async getAccessibleBranchIds(
    tenant: TenantContext,
  ): Promise<AccessibleBranches> {
    if (this.isOrgWideAccess(tenant.role)) {
      return 'all';
    }

    const memberships = await this.prisma.branchMember.findMany({
      where: {
        userId: tenant.userId,
        organizationId: tenant.organizationId,
      },
      select: { branchId: true },
    });

    return memberships.map((membership) => membership.branchId);
  }

  async ensureBranchAccess(
    tenant: TenantContext,
    branchId: string,
  ): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId: tenant.organizationId,
      },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (this.isOrgWideAccess(tenant.role)) {
      return;
    }

    const membership = await this.prisma.branchMember.findUnique({
      where: {
        branchId_userId: {
          branchId,
          userId: tenant.userId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('No access to this branch');
    }
  }

  async resolveBranchFilter(
    tenant: TenantContext,
    branchId?: string,
  ): Promise<Prisma.StringFilter | string | undefined> {
    if (branchId) {
      await this.ensureBranchAccess(tenant, branchId);
      return branchId;
    }

    const accessible = await this.getAccessibleBranchIds(tenant);

    if (accessible === 'all') {
      return undefined;
    }

    if (accessible.length === 0) {
      return { in: [] };
    }

    return { in: accessible };
  }
}
