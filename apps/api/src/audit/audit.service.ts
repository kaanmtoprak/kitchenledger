import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@kitchenledger/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../common/pagination/pagination.util';
import { TenantContext } from '../common/types/tenant-context.type';
import { removeSensitiveFields, toAuditJson } from './audit-sanitize.util';
import { AuditLogParams } from './audit.types';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

const branchSummarySelect = {
  id: true,
  name: true,
  code: true,
} satisfies Prisma.BranchSelect;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    params: AuditLogParams,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    let actorEmail = params.actorEmail ?? null;

    if (params.actorUserId && !actorEmail) {
      const actor = await client.user.findUnique({
        where: { id: params.actorUserId },
        select: { email: true },
      });
      actorEmail = actor?.email ?? null;
    }

    await client.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId ?? null,
        actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        entityLabel: params.entityLabel ?? null,
        branchId: params.branchId ?? null,
        before: toAuditJson(params.before) ?? Prisma.JsonNull,
        after: toAuditJson(params.after) ?? Prisma.JsonNull,
        metadata: toAuditJson(params.metadata) ?? Prisma.JsonNull,
      },
    });
  }

  async logFromTenant(
    tenant: TenantContext,
    params: Omit<AuditLogParams, 'organizationId' | 'actorUserId'>,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.log(
      {
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        ...params,
      },
      tx,
    );
  }

  sanitizeBeforeAfter<T>(value: T): T {
    return removeSensitiveFields(value);
  }

  buildSummary(params: {
    action: AuditAction;
    entityType: string;
    entityLabel?: string | null;
    metadata?: unknown;
  }): string {
    if (params.entityLabel) {
      return params.entityLabel;
    }

    if (
      params.metadata &&
      typeof params.metadata === 'object' &&
      !Array.isArray(params.metadata)
    ) {
      const metadata = params.metadata as Record<string, unknown>;
      if (typeof metadata.invoiceNumber === 'string') {
        return metadata.invoiceNumber;
      }
      if (typeof metadata.orderNumber === 'string') {
        return metadata.orderNumber;
      }
      if (typeof metadata.productName === 'string') {
        return metadata.productName;
      }
      if (typeof metadata.ingredientName === 'string') {
        return metadata.ingredientName;
      }
    }

    return params.entityType;
  }

  async list(tenant: TenantContext, query: ListAuditLogsQueryDto) {
    const pagination = parsePagination(query);
    const search = query.search?.trim() || query.q?.trim();

    const where: Prisma.AuditLogWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { actorEmail: { contains: search, mode: 'insensitive' } },
              { entityLabel: { contains: search, mode: 'insensitive' } },
              { entityType: { contains: search, mode: 'insensitive' } },
              { action: { equals: search.toUpperCase() as AuditAction } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          branch: { select: branchSummarySelect },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      entityLabel: row.entityLabel,
      branch: row.branch,
      before: row.before,
      after: row.after,
      metadata: row.metadata,
      summary: this.buildSummary({
        action: row.action,
        entityType: row.entityType,
        entityLabel: row.entityLabel,
        metadata: row.metadata,
      }),
    }));

    return buildPaginatedResponse(data, total, pagination);
  }
}
