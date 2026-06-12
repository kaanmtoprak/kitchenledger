import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, BaseUnit, Prisma, StockMovementType } from '@kitchenledger/db';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../common/pagination/pagination.util';
import { BranchAccessService } from '../common/services/branch-access.service';
import {
  IngredientConsumptionPlan,
  StockConsumptionService,
} from '../common/services/stock-consumption.service';
import { TenantContext } from '../common/types/tenant-context.type';
import { serializeDecimal, toDecimal } from '../common/utils/decimal.util';
import {
  CreateProductionDto,
  validateQuantityProduced,
} from './dto/create-production.dto';
import { ListProductionsQueryDto } from './dto/list-productions-query.dto';

@Injectable()
export class ProductionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
    private readonly stockConsumptionService: StockConsumptionService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenant: TenantContext, dto: CreateProductionDto) {
    try {
      validateQuantityProduced(dto.quantityProduced);
    } catch {
      throw new BadRequestException('Invalid quantity produced');
    }

    await this.branchAccessService.ensureBranchAccess(tenant, dto.branchId);

    const quantityProduced = toDecimal(dto.quantityProduced);
    const producedAt = dto.producedAt ? new Date(dto.producedAt) : new Date();

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        organizationId: tenant.organizationId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const recipe = await this.prisma.recipe.findFirst({
      where: {
        productId: dto.productId,
        organizationId: tenant.organizationId,
      },
      include: {
        items: {
          select: {
            ingredientId: true,
            quantity: true,
            unit: true,
            ingredient: {
              select: { id: true, name: true, baseUnit: true },
            },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.items.length === 0) {
      throw new BadRequestException('Recipe has no items');
    }

    if (recipe.yieldQuantity.lte(0)) {
      throw new BadRequestException(
        'Recipe yield quantity must be greater than zero',
      );
    }

    for (const item of recipe.items) {
      if (item.unit !== item.ingredient.baseUnit) {
        throw new BadRequestException(
          `Unit mismatch for ingredient ${item.ingredient.name}: expected ${item.ingredient.baseUnit}`,
        );
      }
    }

    const requiredItems = recipe.items.map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient.name,
      unit: item.unit as BaseUnit,
      requiredQuantity: item.quantity
        .mul(quantityProduced)
        .div(recipe.yieldQuantity),
    }));

    return this.prisma.$transaction(async (tx) => {
      const consumptionPlans: IngredientConsumptionPlan[] = [];

      for (const required of requiredItems) {
        const batches = await this.stockConsumptionService.getAvailableBatches(
          tx,
          tenant.organizationId,
          dto.branchId,
          required.ingredientId,
        );

        const available =
          this.stockConsumptionService.sumAvailableQuantity(batches);
        this.stockConsumptionService.assertSufficientStock(
          required.ingredientName,
          required.unit,
          required.requiredQuantity,
          available,
        );

        const batchPlan = this.stockConsumptionService.planFifoConsumption(
          batches,
          required.requiredQuantity,
        );

        if (!batchPlan) {
          this.stockConsumptionService.throwInsufficientStock(
            required.ingredientName,
            required.unit,
            required.requiredQuantity,
            available,
          );
        }

        const totalCost = batchPlan.reduce(
          (sum, batch) => sum.add(batch.cost),
          new Prisma.Decimal(0),
        );

        consumptionPlans.push({
          ingredientId: required.ingredientId,
          ingredientName: required.ingredientName,
          unit: required.unit,
          requiredQuantity: required.requiredQuantity,
          batches: batchPlan,
          totalCost,
        });
      }

      const totalCostSnapshot = consumptionPlans.reduce(
        (sum, plan) => sum.add(plan.totalCost),
        new Prisma.Decimal(0),
      );
      const unitCostSnapshot = totalCostSnapshot.div(quantityProduced);

      const production = await tx.production.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: dto.branchId,
          productId: dto.productId,
          recipeId: recipe.id,
          quantityProduced,
          totalCostSnapshot,
          unitCostSnapshot,
          producedAt,
          notes: dto.notes?.trim() || null,
        },
      });

      for (const plan of consumptionPlans) {
        for (const batchPlan of plan.batches) {
          const batch = await tx.stockBatch.findUnique({
            where: { id: batchPlan.stockBatchId },
            select: { id: true, remainingQuantity: true },
          });

          const availableQuantity =
            batch?.remainingQuantity ?? new Prisma.Decimal(0);

          if (!batch || availableQuantity.lt(batchPlan.consumedQuantity)) {
            this.stockConsumptionService.throwInsufficientStock(
              plan.ingredientName,
              plan.unit,
              batchPlan.consumedQuantity,
              availableQuantity,
            );
          }

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: {
              remainingQuantity: batch.remainingQuantity.sub(
                batchPlan.consumedQuantity,
              ),
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId: tenant.organizationId,
              branchId: dto.branchId,
              ingredientId: plan.ingredientId,
              stockBatchId: batchPlan.stockBatchId,
              productionId: production.id,
              type: StockMovementType.PRODUCTION_CONSUMPTION,
              quantity: batchPlan.consumedQuantity,
              unit: plan.unit,
              reason: 'Production consumption',
            },
          });
        }
      }

      const result = {
        id: production.id,
        branchId: production.branchId,
        productId: production.productId,
        recipeId: production.recipeId,
        quantityProduced: serializeDecimal(production.quantityProduced),
        totalCostSnapshot: serializeDecimal(production.totalCostSnapshot),
        unitCostSnapshot: serializeDecimal(production.unitCostSnapshot),
        producedAt: production.producedAt,
        notes: production.notes,
        consumptions: consumptionPlans.map((plan) => ({
          ingredientId: plan.ingredientId,
          ingredientName: plan.ingredientName,
          quantity: serializeDecimal(plan.requiredQuantity),
          unit: plan.unit,
          cost: serializeDecimal(plan.totalCost),
          batches: plan.batches.map((batch) => ({
            stockBatchId: batch.stockBatchId,
            consumedQuantity: serializeDecimal(batch.consumedQuantity),
            unitCost: serializeDecimal(batch.unitCost),
            cost: serializeDecimal(batch.cost),
          })),
        })),
      };

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.CREATE,
          entityType: 'Production',
          entityId: production.id,
          entityLabel: product.name,
          branchId: production.branchId,
          after: result,
          metadata: {
            productName: product.name,
            quantityProduced: result.quantityProduced,
            totalCostSnapshot: result.totalCostSnapshot,
          },
        },
        tx,
      );

      return result;
    });
  }

  async list(tenant: TenantContext, query: ListProductionsQueryDto) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    if (query.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: query.productId, organizationId: tenant.organizationId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const where: Prisma.ProductionWhereInput = {
      organizationId: tenant.organizationId,
      ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.from || query.to
        ? {
            producedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            product: {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { sku: { contains: query.q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.production.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          productId: true,
          quantityProduced: true,
          totalCostSnapshot: true,
          unitCostSnapshot: true,
          producedAt: true,
          notes: true,
          branch: { select: { name: true } },
          product: { select: { name: true, sku: true } },
        },
        orderBy: { producedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.production.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      branchId: row.branchId,
      branchName: row.branch.name,
      productId: row.productId,
      productName: row.product.name,
      productSku: row.product.sku,
      quantityProduced: serializeDecimal(row.quantityProduced),
      totalCostSnapshot: serializeDecimal(row.totalCostSnapshot),
      unitCostSnapshot: serializeDecimal(row.unitCostSnapshot),
      producedAt: row.producedAt,
      notes: row.notes,
    }));

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const production = await this.prisma.production.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
          },
        },
        stockMovements: {
          select: {
            id: true,
            ingredientId: true,
            stockBatchId: true,
            quantity: true,
            unit: true,
            createdAt: true,
            ingredient: { select: { id: true, name: true, sku: true } },
            stockBatch: {
              select: { id: true, unitCost: true, receivedAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!production) {
      throw new NotFoundException('Production not found');
    }

    await this.branchAccessService.ensureBranchAccess(
      tenant,
      production.branchId,
    );

    const consumptionsMap = new Map<
      string,
      {
        ingredientId: string;
        ingredientName: string;
        quantity: Prisma.Decimal;
        unit: BaseUnit;
        cost: Prisma.Decimal;
        batches: Array<{
          stockBatchId: string | null;
          consumedQuantity: string;
          unitCost: string | null;
          cost: string;
          movementId: string;
        }>;
      }
    >();

    for (const movement of production.stockMovements) {
      const movementCost = movement.stockBatch
        ? movement.quantity.mul(movement.stockBatch.unitCost)
        : new Prisma.Decimal(0);

      const existing = consumptionsMap.get(movement.ingredientId);
      if (!existing) {
        consumptionsMap.set(movement.ingredientId, {
          ingredientId: movement.ingredientId,
          ingredientName: movement.ingredient.name,
          quantity: movement.quantity,
          unit: movement.unit,
          cost: movementCost,
          batches: [
            {
              stockBatchId: movement.stockBatchId,
              consumedQuantity: serializeDecimal(movement.quantity)!,
              unitCost: movement.stockBatch
                ? serializeDecimal(movement.stockBatch.unitCost)
                : null,
              cost: serializeDecimal(movementCost)!,
              movementId: movement.id,
            },
          ],
        });
        continue;
      }

      existing.quantity = existing.quantity.add(movement.quantity);
      existing.cost = existing.cost.add(movementCost);
      existing.batches.push({
        stockBatchId: movement.stockBatchId,
        consumedQuantity: serializeDecimal(movement.quantity)!,
        unitCost: movement.stockBatch
          ? serializeDecimal(movement.stockBatch.unitCost)
          : null,
        cost: serializeDecimal(movementCost)!,
        movementId: movement.id,
      });
    }

    return {
      id: production.id,
      branchId: production.branchId,
      productId: production.productId,
      recipeId: production.recipeId,
      quantityProduced: serializeDecimal(production.quantityProduced),
      totalCostSnapshot: serializeDecimal(production.totalCostSnapshot),
      unitCostSnapshot: serializeDecimal(production.unitCostSnapshot),
      producedAt: production.producedAt,
      notes: production.notes,
      createdAt: production.createdAt,
      updatedAt: production.updatedAt,
      branch: production.branch,
      product: production.product,
      recipe: {
        id: production.recipe.id,
        name: production.recipe.name,
        yieldQuantity: serializeDecimal(production.recipe.yieldQuantity),
        yieldUnit: production.recipe.yieldUnit,
      },
      consumptions: [...consumptionsMap.values()].map((consumption) => ({
        ingredientId: consumption.ingredientId,
        ingredientName: consumption.ingredientName,
        quantity: serializeDecimal(consumption.quantity),
        unit: consumption.unit,
        cost: serializeDecimal(consumption.cost),
        batches: consumption.batches,
      })),
    };
  }
}
