import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@kitchenledger/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../common/pagination/pagination.util';
import { TenantContext } from '../common/types/tenant-context.type';
import { normalizeCode, normalizeName } from '../common/utils/normalize.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

const branchSelect = {
  id: true,
  name: true,
  code: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BranchSelect;

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenant: TenantContext, query: ListBranchesQueryDto) {
    const pagination = parsePagination(query);
    const where: Prisma.BranchWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { code: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        select: branchSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: branchSelect,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async create(tenant: TenantContext, dto: CreateBranchDto) {
    const name = normalizeName(dto.name);
    const code = normalizeCode(dto.code);

    await this.assertCodeAvailable(tenant.organizationId, code);

    const branch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          organizationId: tenant.organizationId,
          name,
          code,
        },
        select: branchSelect,
      });

      await tx.branchMember.upsert({
        where: {
          branchId_userId: {
            branchId: created.id,
            userId: tenant.userId,
          },
        },
        update: {},
        create: {
          branchId: created.id,
          userId: tenant.userId,
          organizationId: tenant.organizationId,
        },
      });

      return created;
    });

    return branch;
  }

  async update(tenant: TenantContext, id: string, dto: UpdateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: { id: true, code: true },
    });

    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    const data: Prisma.BranchUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = normalizeName(dto.name);
    }

    if (dto.code !== undefined) {
      const code = normalizeCode(dto.code);
      if (code !== existing.code) {
        await this.assertCodeAvailable(tenant.organizationId, code, id);
      }
      data.code = code;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.branch.update({
      where: { id: existing.id },
      data,
      select: branchSelect,
    });
  }

  async softDelete(tenant: TenantContext, id: string) {
    const existing = await this.prisma.branch.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    await this.prisma.branch.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  private async assertCodeAvailable(
    organizationId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.branch.findFirst({
      where: {
        organizationId,
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Branch code already exists');
    }
  }
}
