import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@kitchenledger/db';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../common/pagination/pagination.util';
import { TenantContext } from '../common/types/tenant-context.type';
import { normalizeName } from '../common/utils/normalize.util';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const supplierSelect = {
  id: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenant: TenantContext, query: ListSuppliersQueryDto) {
    const pagination = parsePagination(query);
    const where: Prisma.SupplierWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { contactName: { contains: query.q, mode: 'insensitive' } },
              { phone: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        select: supplierSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return buildPaginatedResponse(rows, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: supplierSelect,
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async create(tenant: TenantContext, dto: CreateSupplierDto) {
    const name = normalizeName(dto.name);
    await this.assertNameAvailable(tenant.organizationId, name);

    const supplier = await this.prisma.supplier.create({
      data: {
        organizationId: tenant.organizationId,
        name,
        contactName: dto.contactName?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        notes: dto.notes?.trim() || null,
      },
      select: supplierSelect,
    });

    await this.auditService.logFromTenant(tenant, {
      action: AuditAction.CREATE,
      entityType: 'Supplier',
      entityId: supplier.id,
      entityLabel: supplier.name,
      after: supplier,
    });

    return supplier;
  }

  async update(tenant: TenantContext, id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: supplierSelect,
    });

    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const data: Prisma.SupplierUpdateInput = {};

    if (dto.name !== undefined) {
      const name = normalizeName(dto.name);
      if (name.toLowerCase() !== existing.name.toLowerCase()) {
        await this.assertNameAvailable(tenant.organizationId, name, id);
      }
      data.name = name;
    }

    if (dto.contactName !== undefined) {
      data.contactName = dto.contactName.trim() || null;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() || null;
    }

    if (dto.email !== undefined) {
      data.email = dto.email.trim().toLowerCase() || null;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const supplier = await this.prisma.supplier.update({
      where: { id: existing.id },
      data,
      select: supplierSelect,
    });

    let action: AuditAction = AuditAction.UPDATE;
    if (dto.isActive === false && existing.isActive) {
      action = AuditAction.DEACTIVATE;
    } else if (dto.isActive === true && !existing.isActive) {
      action = AuditAction.ACTIVATE;
    }

    await this.auditService.logFromTenant(tenant, {
      action,
      entityType: 'Supplier',
      entityId: supplier.id,
      entityLabel: supplier.name,
      before: existing,
      after: supplier,
    });

    return supplier;
  }

  async softDelete(tenant: TenantContext, id: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: supplierSelect,
    });

    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    await this.prisma.supplier.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await this.auditService.logFromTenant(tenant, {
      action: AuditAction.DEACTIVATE,
      entityType: 'Supplier',
      entityId: existing.id,
      entityLabel: existing.name,
      before: { isActive: true },
      after: { isActive: false },
    });

    return { success: true };
  }

  private async assertNameAvailable(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.supplier.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Supplier name already exists');
    }
  }
}
