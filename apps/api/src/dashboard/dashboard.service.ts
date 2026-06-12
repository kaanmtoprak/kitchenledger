import { Injectable } from '@nestjs/common';
import { Prisma, ProductionStatus } from '@kitchenledger/db';
import { PrismaService } from '../prisma/prisma.service';
import { BranchAccessService } from '../common/services/branch-access.service';
import { TenantContext } from '../common/types/tenant-context.type';
import { serializeDecimal } from '../common/utils/decimal.util';
import {
  appendZeroStockMinimumRows,
  buildBranchWhere,
} from '../common/utils/stock-summary.util';
import {
  DashboardDateQueryDto,
  DashboardLowStockQueryDto,
  DashboardRecentActivityQueryDto,
  DashboardTopItemsQueryDto,
} from './dto/dashboard-query.dto';
import { parseDashboardDateRange } from './utils/dashboard-date.util';

type StockGroupRow = {
  branchId: string;
  branchName: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  totalRemaining: Prisma.Decimal;
  totalValue: Prisma.Decimal;
  minimumStockLevel: Prisma.Decimal | null;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
  ) {}

  async getSummary(tenant: TenantContext, query: DashboardDateQueryDto) {
    const range = parseDashboardDateRange(query.from, query.to);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    const stockRows = await this.getStockGroups(
      tenant.organizationId,
      branchFilter,
    );
    const totalStockValue = stockRows.reduce(
      (sum, row) => sum.add(row.totalValue),
      new Prisma.Decimal(0),
    );
    const lowStockIngredientCount = stockRows.filter((row) =>
      this.isLowStock(row),
    ).length;

    const [
      activeIngredientCount,
      activeProductCount,
      branchCount,
      purchaseStats,
      productionStats,
    ] = await Promise.all([
      this.prisma.ingredient.count({
        where: { organizationId: tenant.organizationId, isActive: true },
      }),
      this.prisma.product.count({
        where: { organizationId: tenant.organizationId, isActive: true },
      }),
      this.prisma.branch.count({
        where: {
          organizationId: tenant.organizationId,
          isActive: true,
          ...(branchFilter !== undefined ? { id: branchFilter } : {}),
        },
      }),
      this.getPurchaseStats(tenant.organizationId, branchFilter, range),
      this.getProductionStats(tenant.organizationId, branchFilter, range),
    ]);

    return {
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      branches: { count: branchCount },
      inventory: {
        totalStockValue: serializeDecimal(totalStockValue),
        lowStockIngredientCount,
        activeIngredientCount,
      },
      purchases: {
        totalPurchaseCost: serializeDecimal(purchaseStats.totalCost),
        purchaseCount: purchaseStats.count,
      },
      production: {
        productionCount: productionStats.count,
        totalProducedQuantity: serializeDecimal(productionStats.totalQuantity),
        totalProductionCost: serializeDecimal(productionStats.totalCost),
        averageProductionUnitCost: productionStats.totalQuantity.isZero()
          ? '0'
          : serializeDecimal(
              productionStats.totalCost.div(productionStats.totalQuantity),
            ),
      },
      products: {
        activeProductCount,
      },
    };
  }

  async getLowStock(tenant: TenantContext, query: DashboardLowStockQueryDto) {
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );
    const limit = query.limit ?? 10;

    const stockRows = await this.getStockGroups(
      tenant.organizationId,
      branchFilter,
    );

    const lowStockRows = stockRows
      .filter((row) => row.minimumStockLevel !== null && this.isLowStock(row))
      .map((row) => {
        const minimum = row.minimumStockLevel!;
        const shortage = minimum.sub(row.totalRemaining);

        return {
          branchId: row.branchId,
          branchName: row.branchName,
          ingredientId: row.ingredientId,
          ingredientName: row.ingredientName,
          sku: row.sku,
          unit: row.unit,
          totalRemaining: serializeDecimal(row.totalRemaining),
          minimumStockLevel: serializeDecimal(minimum),
          shortage: serializeDecimal(shortage),
          isOutOfStock: row.totalRemaining.isZero(),
        };
      })
      .sort((a, b) => Number(b.shortage) - Number(a.shortage))
      .slice(0, limit);

    return { data: lowStockRows };
  }

  async getProductionTrend(
    tenant: TenantContext,
    query: DashboardDateQueryDto,
  ) {
    const range = parseDashboardDateRange(query.from, query.to);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    const productions = await this.prisma.production.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: ProductionStatus.ACTIVE,
        producedAt: { gte: range.from, lte: range.to },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      },
      select: {
        producedAt: true,
        quantityProduced: true,
        totalCostSnapshot: true,
      },
    });

    const grouped = new Map<
      string,
      {
        productionCount: number;
        totalCost: Prisma.Decimal;
        totalQuantity: Prisma.Decimal;
      }
    >();

    for (const production of productions) {
      const dateKey = production.producedAt.toISOString().slice(0, 10);
      const existing = grouped.get(dateKey) ?? {
        productionCount: 0,
        totalCost: new Prisma.Decimal(0),
        totalQuantity: new Prisma.Decimal(0),
      };

      existing.productionCount += 1;
      existing.totalCost = existing.totalCost.add(production.totalCostSnapshot);
      existing.totalQuantity = existing.totalQuantity.add(
        production.quantityProduced,
      );
      grouped.set(dateKey, existing);
    }

    const data = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        productionCount: stats.productionCount,
        totalCost: serializeDecimal(stats.totalCost),
        totalQuantity: serializeDecimal(stats.totalQuantity),
      }));

    return { data };
  }

  async getTopProductsByCost(
    tenant: TenantContext,
    query: DashboardTopItemsQueryDto,
  ) {
    const range = parseDashboardDateRange(query.from, query.to);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );
    const limit = query.limit ?? 5;

    const productions = await this.prisma.production.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: ProductionStatus.ACTIVE,
        producedAt: { gte: range.from, lte: range.to },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      },
      select: {
        productId: true,
        quantityProduced: true,
        totalCostSnapshot: true,
        product: { select: { name: true, sku: true } },
      },
    });

    const grouped = new Map<
      string,
      {
        productName: string;
        productSku: string;
        productionCount: number;
        totalQuantity: Prisma.Decimal;
        totalCost: Prisma.Decimal;
      }
    >();

    for (const production of productions) {
      const existing = grouped.get(production.productId) ?? {
        productName: production.product.name,
        productSku: production.product.sku,
        productionCount: 0,
        totalQuantity: new Prisma.Decimal(0),
        totalCost: new Prisma.Decimal(0),
      };

      existing.productionCount += 1;
      existing.totalQuantity = existing.totalQuantity.add(
        production.quantityProduced,
      );
      existing.totalCost = existing.totalCost.add(production.totalCostSnapshot);
      grouped.set(production.productId, existing);
    }

    const data = [...grouped.entries()]
      .map(([productId, stats]) => ({
        productId,
        productName: stats.productName,
        productSku: stats.productSku,
        productionCount: stats.productionCount,
        totalProducedQuantity: serializeDecimal(stats.totalQuantity),
        totalProductionCost: serializeDecimal(stats.totalCost),
        averageUnitCost: stats.totalQuantity.isZero()
          ? '0'
          : serializeDecimal(stats.totalCost.div(stats.totalQuantity)),
      }))
      .sort(
        (a, b) => Number(b.totalProductionCost) - Number(a.totalProductionCost),
      )
      .slice(0, limit);

    return { data };
  }

  async getPurchaseSummaryBySupplier(
    tenant: TenantContext,
    query: DashboardTopItemsQueryDto,
  ) {
    const range = parseDashboardDateRange(query.from, query.to);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );
    const limit = query.limit ?? 5;

    const purchases = await this.prisma.purchase.findMany({
      where: {
        organizationId: tenant.organizationId,
        purchasedAt: { gte: range.from, lte: range.to },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      },
      select: {
        id: true,
        supplierId: true,
        supplier: { select: { name: true } },
        items: { select: { totalPrice: true } },
      },
    });

    const grouped = new Map<
      string,
      {
        supplierId: string | null;
        supplierName: string;
        purchaseCount: number;
        totalCost: Prisma.Decimal;
      }
    >();

    for (const purchase of purchases) {
      const key = purchase.supplierId ?? '__none__';
      const existing = grouped.get(key) ?? {
        supplierId: purchase.supplierId,
        supplierName: purchase.supplier?.name ?? 'No supplier',
        purchaseCount: 0,
        totalCost: new Prisma.Decimal(0),
      };

      existing.purchaseCount += 1;
      const purchaseTotal = purchase.items.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );
      existing.totalCost = existing.totalCost.add(purchaseTotal);
      grouped.set(key, existing);
    }

    const data = [...grouped.values()]
      .map((row) => ({
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        purchaseCount: row.purchaseCount,
        totalPurchaseCost: serializeDecimal(row.totalCost),
      }))
      .sort((a, b) => Number(b.totalPurchaseCost) - Number(a.totalPurchaseCost))
      .slice(0, limit);

    return { data };
  }

  async getRecentActivity(
    tenant: TenantContext,
    query: DashboardRecentActivityQueryDto,
  ) {
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );
    const limit = query.limit ?? 10;
    const fetchLimit = limit * 2;

    const [productions, purchases] = await Promise.all([
      this.prisma.production.findMany({
        where: {
          organizationId: tenant.organizationId,
          ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
        },
        select: {
          id: true,
          branchId: true,
          status: true,
          quantityProduced: true,
          totalCostSnapshot: true,
          createdAt: true,
          cancelledAt: true,
          branch: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      }),
      this.prisma.purchase.findMany({
        where: {
          organizationId: tenant.organizationId,
          ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
        },
        select: {
          id: true,
          branchId: true,
          invoiceNumber: true,
          createdAt: true,
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      }),
    ]);

    const activities = [
      ...productions.map((production) => ({
        type: 'PRODUCTION' as const,
        id: production.id,
        title:
          production.status === ProductionStatus.CANCELLED
            ? `Üretim iptal edildi: ${production.product.name}`
            : `Produced ${production.product.name}`,
        description:
          production.status === ProductionStatus.CANCELLED
            ? `İptal: ${serializeDecimal(production.quantityProduced)} adet`
            : `Quantity: ${serializeDecimal(production.quantityProduced)}, Cost: ${serializeDecimal(production.totalCostSnapshot)}`,
        branchId: production.branchId,
        branchName: production.branch.name,
        createdAt:
          production.status === ProductionStatus.CANCELLED &&
          production.cancelledAt
            ? production.cancelledAt
            : production.createdAt,
      })),
      ...purchases.map((purchase) => ({
        type: 'PURCHASE' as const,
        id: purchase.id,
        title: 'Purchase received',
        description: purchase.invoiceNumber
          ? `Invoice: ${purchase.invoiceNumber}`
          : 'Purchase received',
        branchId: purchase.branchId,
        branchName: purchase.branch.name,
        createdAt: purchase.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return { data: activities };
  }

  private async getStockGroups(
    organizationId: string,
    branchFilter: Prisma.StringFilter | string | undefined,
  ): Promise<StockGroupRow[]> {
    const batches = await this.prisma.stockBatch.findMany({
      where: {
        organizationId,
        remainingQuantity: { gt: 0 },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
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
      StockGroupRow & { _sumQty: Prisma.Decimal; _sumValue: Prisma.Decimal }
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
          totalRemaining: sumQty,
          totalValue: sumValue,
          minimumStockLevel: batch.ingredient.minimumStockLevel,
          _sumQty: sumQty,
          _sumValue: sumValue,
        });
        continue;
      }

      existing._sumQty = existing._sumQty.add(batch.remainingQuantity);
      existing._sumValue = existing._sumValue.add(
        batch.remainingQuantity.mul(batch.unitCost),
      );
      existing.totalRemaining = existing._sumQty;
      existing.totalValue = existing._sumValue;
    }

    const [branches, minimumIngredients] = await Promise.all([
      this.prisma.branch.findMany({
        where: buildBranchWhere(organizationId, branchFilter),
        select: { id: true, name: true },
      }),
      this.prisma.ingredient.findMany({
        where: {
          organizationId,
          isActive: true,
          minimumStockLevel: { not: null },
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

    appendZeroStockMinimumRows(
      grouped,
      branches,
      minimumIngredients.filter(
        (
          ingredient,
        ): ingredient is typeof ingredient & {
          minimumStockLevel: Prisma.Decimal;
        } => ingredient.minimumStockLevel !== null,
      ),
      (branch, ingredient) => ({
        branchId: branch.id,
        branchName: branch.name,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        sku: ingredient.sku,
        unit: ingredient.baseUnit,
        totalRemaining: new Prisma.Decimal(0),
        totalValue: new Prisma.Decimal(0),
        minimumStockLevel: ingredient.minimumStockLevel,
        _sumQty: new Prisma.Decimal(0),
        _sumValue: new Prisma.Decimal(0),
      }),
    );

    return [...grouped.values()].map(({ _sumQty, _sumValue, ...row }) => {
      void _sumQty;
      void _sumValue;
      return row;
    });
  }

  private isLowStock(row: StockGroupRow): boolean {
    if (row.minimumStockLevel === null) {
      return false;
    }
    return row.totalRemaining.lte(row.minimumStockLevel);
  }

  private async getPurchaseStats(
    organizationId: string,
    branchFilter: Prisma.StringFilter | string | undefined,
    range: { from: Date; to: Date },
  ) {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        organizationId,
        purchasedAt: { gte: range.from, lte: range.to },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      },
      select: {
        items: { select: { totalPrice: true } },
      },
    });

    const totalCost = purchases.reduce((sum, purchase) => {
      const purchaseTotal = purchase.items.reduce(
        (itemSum, item) => itemSum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );
      return sum.add(purchaseTotal);
    }, new Prisma.Decimal(0));

    return { count: purchases.length, totalCost };
  }

  private async getProductionStats(
    organizationId: string,
    branchFilter: Prisma.StringFilter | string | undefined,
    range: { from: Date; to: Date },
  ) {
    const productions = await this.prisma.production.findMany({
      where: {
        organizationId,
        status: ProductionStatus.ACTIVE,
        producedAt: { gte: range.from, lte: range.to },
        ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      },
      select: {
        quantityProduced: true,
        totalCostSnapshot: true,
      },
    });

    const totalQuantity = productions.reduce(
      (sum, production) => sum.add(production.quantityProduced),
      new Prisma.Decimal(0),
    );
    const totalCost = productions.reduce(
      (sum, production) => sum.add(production.totalCostSnapshot),
      new Prisma.Decimal(0),
    );

    return { count: productions.length, totalQuantity, totalCost };
  }
}
