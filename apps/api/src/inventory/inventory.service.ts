import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@kitchenledger/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../common/pagination/pagination.util';
import { BranchAccessService } from '../common/services/branch-access.service';
import { TenantContext } from '../common/types/tenant-context.type';
import { serializeDecimal, toDecimal } from '../common/utils/decimal.util';
import { buildBranchWhere } from '../common/utils/stock-summary.util';
import { ListStockBatchesQueryDto } from './dto/list-stock-batches-query.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { ListStockQueryDto } from './dto/list-stock-query.dto';

type StockSummaryRow = {
  branchId: string;
  branchName: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  totalRemaining: string;
  weightedAverageUnitCost: string;
  totalValue: string;
  minimumStockLevel: string | null;
  isLowStock: boolean;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
  ) {}

  async listStockSummary(tenant: TenantContext, query: ListStockQueryDto) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    if (query.ingredientId) {
      const ingredient = await this.prisma.ingredient.findFirst({
        where: {
          id: query.ingredientId,
          organizationId: tenant.organizationId,
        },
        select: { id: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
    }

    const batches = await this.prisma.stockBatch.findMany({
      where: {
        organizationId: tenant.organizationId,
        remainingQuantity: { gt: 0 },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
        ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
        ...(query.q
          ? {
              ingredient: {
                OR: [
                  { name: { contains: query.q, mode: 'insensitive' } },
                  { sku: { contains: query.q, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      select: {
        branchId: true,
        ingredientId: true,
        remainingQuantity: true,
        unitCost: true,
        unit: true,
        branch: { select: { name: true } },
        ingredient: {
          select: {
            name: true,
            sku: true,
            minimumStockLevel: true,
          },
        },
      },
    });

    const grouped = new Map<
      string,
      StockSummaryRow & { _sumQty: Prisma.Decimal; _sumValue: Prisma.Decimal }
    >();

    for (const batch of batches) {
      const key = `${batch.branchId}:${batch.ingredientId}`;
      const existing = grouped.get(key);

      if (!existing) {
        const sumQty = batch.remainingQuantity;
        const sumValue = batch.remainingQuantity.mul(batch.unitCost);
        grouped.set(key, {
          branchId: batch.branchId,
          branchName: batch.branch.name,
          ingredientId: batch.ingredientId,
          ingredientName: batch.ingredient.name,
          sku: batch.ingredient.sku,
          unit: batch.unit,
          totalRemaining: serializeDecimal(sumQty)!,
          weightedAverageUnitCost: serializeDecimal(sumValue.div(sumQty))!,
          totalValue: serializeDecimal(sumValue)!,
          minimumStockLevel: serializeDecimal(
            batch.ingredient.minimumStockLevel,
          ),
          isLowStock: false,
          _sumQty: sumQty,
          _sumValue: sumValue,
        });
        continue;
      }

      existing._sumQty = existing._sumQty.add(batch.remainingQuantity);
      existing._sumValue = existing._sumValue.add(
        batch.remainingQuantity.mul(batch.unitCost),
      );
      existing.totalRemaining = serializeDecimal(existing._sumQty)!;
      existing.totalValue = serializeDecimal(existing._sumValue)!;
      existing.weightedAverageUnitCost = existing._sumQty.isZero()
        ? '0'
        : serializeDecimal(existing._sumValue.div(existing._sumQty))!;
    }

    let rows = [...grouped.values()].map((entry) => {
      const { _sumQty, _sumValue, ...row } = entry;
      void _sumQty;
      void _sumValue;

      const minimum = row.minimumStockLevel
        ? toDecimal(row.minimumStockLevel)
        : null;
      const totalRemaining = toDecimal(row.totalRemaining);
      const isLowStock = minimum !== null && totalRemaining.lte(minimum);

      return { ...row, isLowStock };
    });

    if (query.lowStockOnly) {
      const [branches, minimumIngredients] = await Promise.all([
        this.prisma.branch.findMany({
          where: buildBranchWhere(tenant.organizationId, branchFilter),
          select: { id: true, name: true },
        }),
        this.prisma.ingredient.findMany({
          where: {
            organizationId: tenant.organizationId,
            isActive: true,
            minimumStockLevel: { not: null },
            ...(query.ingredientId ? { id: query.ingredientId } : {}),
            ...(query.q
              ? {
                  OR: [
                    { name: { contains: query.q, mode: 'insensitive' } },
                    { sku: { contains: query.q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            sku: true,
            baseUnit: true,
            minimumStockLevel: true,
          },
        }),
      ]);

      const existingKeys = new Set(
        rows.map((row) => `${row.branchId}:${row.ingredientId}`),
      );

      for (const branch of branches) {
        for (const ingredient of minimumIngredients) {
          const key = `${branch.id}:${ingredient.id}`;
          if (existingKeys.has(key)) {
            continue;
          }

          rows.push({
            branchId: branch.id,
            branchName: branch.name,
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            sku: ingredient.sku,
            unit: ingredient.baseUnit,
            totalRemaining: '0',
            weightedAverageUnitCost: '0',
            totalValue: '0',
            minimumStockLevel: serializeDecimal(ingredient.minimumStockLevel),
            isLowStock: true,
          });
        }
      }

      rows = rows.filter((row) => row.isLowStock);
    }

    rows.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

    const total = rows.length;
    const data = rows.slice(
      pagination.skip,
      pagination.skip + pagination.limit,
    );

    return buildPaginatedResponse(data, total, pagination);
  }

  async listBatches(tenant: TenantContext, query: ListStockBatchesQueryDto) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    if (query.ingredientId) {
      const ingredient = await this.prisma.ingredient.findFirst({
        where: {
          id: query.ingredientId,
          organizationId: tenant.organizationId,
        },
        select: { id: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
    }

    const where: Prisma.StockBatchWhereInput = {
      organizationId: tenant.organizationId,
      ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
      ...(query.onlyAvailable ? { remainingQuantity: { gt: 0 } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockBatch.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          ingredientId: true,
          initialQuantity: true,
          remainingQuantity: true,
          unit: true,
          unitCost: true,
          receivedAt: true,
          createdAt: true,
          branch: { select: { id: true, name: true, code: true } },
          ingredient: {
            select: { id: true, name: true, sku: true, baseUnit: true },
          },
        },
        orderBy: { receivedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.stockBatch.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      branchId: row.branchId,
      ingredientId: row.ingredientId,
      initialQuantity: serializeDecimal(row.initialQuantity),
      remainingQuantity: serializeDecimal(row.remainingQuantity),
      unit: row.unit,
      unitCost: serializeDecimal(row.unitCost),
      receivedAt: row.receivedAt,
      createdAt: row.createdAt,
      branch: row.branch,
      ingredient: row.ingredient,
    }));

    return buildPaginatedResponse(data, total, pagination);
  }

  async listMovements(
    tenant: TenantContext,
    query: ListStockMovementsQueryDto,
  ) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    if (query.ingredientId) {
      const ingredient = await this.prisma.ingredient.findFirst({
        where: {
          id: query.ingredientId,
          organizationId: tenant.organizationId,
        },
        select: { id: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
    }

    const where: Prisma.StockMovementWhereInput = {
      organizationId: tenant.organizationId,
      ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
      ...(query.type ? { type: query.type as StockMovementType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          ingredientId: true,
          stockBatchId: true,
          type: true,
          quantity: true,
          unit: true,
          reason: true,
          createdAt: true,
          branch: { select: { id: true, name: true, code: true } },
          ingredient: { select: { id: true, name: true, sku: true } },
          stockBatch: { select: { id: true, receivedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      branchId: row.branchId,
      ingredientId: row.ingredientId,
      stockBatchId: row.stockBatchId,
      type: row.type,
      quantity: serializeDecimal(row.quantity),
      unit: row.unit,
      reason: row.reason,
      createdAt: row.createdAt,
      branch: row.branch,
      ingredient: row.ingredient,
      stockBatch: row.stockBatch,
    }));

    return buildPaginatedResponse(data, total, pagination);
  }
}
