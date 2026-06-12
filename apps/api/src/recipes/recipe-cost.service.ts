import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@kitchenledger/db';
import { PrismaService } from '../prisma/prisma.service';
import { BranchAccessService } from '../common/services/branch-access.service';
import { IngredientCostService } from '../common/services/ingredient-cost.service';
import { TenantContext } from '../common/types/tenant-context.type';
import { serializeDecimal } from '../common/utils/decimal.util';

@Injectable()
export class RecipeCostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
    private readonly ingredientCostService: IngredientCostService,
  ) {}

  async calculate(tenant: TenantContext, recipeId: string, branchId: string) {
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    await this.branchAccessService.ensureBranchAccess(tenant, branchId);

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId: tenant.organizationId },
      select: { id: true, name: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, organizationId: tenant.organizationId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            defaultServingCount: true,
          },
        },
        items: {
          select: {
            ingredientId: true,
            quantity: true,
            unit: true,
            ingredient: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    let totalCost = new Prisma.Decimal(0);
    let hasMissingCosts = false;

    const items = await Promise.all(
      recipe.items.map(async (item) => {
        const weightedAverageUnitCost =
          await this.ingredientCostService.getWeightedAverageUnitCost(
            tenant.organizationId,
            branchId,
            item.ingredientId,
          );

        const isMissingCost = weightedAverageUnitCost === null;
        if (isMissingCost) {
          hasMissingCosts = true;
        }

        const cost = isMissingCost
          ? null
          : item.quantity.mul(weightedAverageUnitCost);

        if (cost !== null) {
          totalCost = totalCost.add(cost);
        }

        return {
          ingredientId: item.ingredientId,
          ingredientName: item.ingredient.name,
          sku: item.ingredient.sku,
          quantity: serializeDecimal(item.quantity),
          unit: item.unit,
          weightedAverageUnitCost: weightedAverageUnitCost
            ? serializeDecimal(weightedAverageUnitCost)
            : null,
          cost: cost ? serializeDecimal(cost) : null,
          isMissingCost,
        };
      }),
    );

    const yieldQuantity = recipe.yieldQuantity;
    const unitCost = yieldQuantity.isZero()
      ? '0'
      : serializeDecimal(totalCost.div(yieldQuantity))!;

    const servingCost =
      recipe.product.defaultServingCount > 0
        ? serializeDecimal(totalCost.div(recipe.product.defaultServingCount))
        : null;

    return {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        product: {
          id: recipe.product.id,
          name: recipe.product.name,
          sku: recipe.product.sku,
          defaultServingCount: String(recipe.product.defaultServingCount),
        },
        yieldQuantity: serializeDecimal(recipe.yieldQuantity),
        yieldUnit: recipe.yieldUnit,
      },
      branch: {
        id: branch.id,
        name: branch.name,
      },
      items,
      summary: {
        totalCost: serializeDecimal(totalCost),
        unitCost,
        servingCost,
        hasMissingCosts,
      },
    };
  }

  static validateItemQuantity(quantity: string): void {
    const value = Number(quantity);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Invalid quantity');
    }
  }

  static validateYieldQuantity(yieldQuantity: string): void {
    const value = Number(yieldQuantity);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Invalid yield quantity');
    }
  }
}
