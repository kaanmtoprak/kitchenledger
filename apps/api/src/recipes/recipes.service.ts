import {
  BadRequestException,
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
import { serializeDecimal, toDecimal } from '../common/utils/decimal.util';
import { normalizeName } from '../common/utils/normalize.util';
import { CreateRecipeDto, CreateRecipeItemDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeCostService } from './recipe-cost.service';

const recipeListSelect = {
  id: true,
  productId: true,
  name: true,
  yieldQuantity: true,
  yieldUnit: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: { id: true, name: true, sku: true },
  },
  _count: {
    select: { items: true },
  },
} satisfies Prisma.RecipeSelect;

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeCostService: RecipeCostService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenant: TenantContext, query: ListRecipesQueryDto) {
    const pagination = parsePagination(query);

    if (query.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: query.productId, organizationId: tenant.organizationId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const where: Prisma.RecipeWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { product: { name: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        select: recipeListSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      name: row.name,
      yieldQuantity: serializeDecimal(row.yieldQuantity),
      yieldUnit: row.yieldUnit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      product: row.product,
      itemCount: row._count.items,
    }));

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, organizationId: tenant.organizationId },
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
            id: true,
            ingredientId: true,
            quantity: true,
            unit: true,
            ingredient: {
              select: { id: true, name: true, sku: true, baseUnit: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return {
      id: recipe.id,
      productId: recipe.productId,
      name: recipe.name,
      yieldQuantity: serializeDecimal(recipe.yieldQuantity),
      yieldUnit: recipe.yieldUnit,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      product: {
        ...recipe.product,
        defaultServingCount: String(recipe.product.defaultServingCount),
      },
      items: recipe.items.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantity: serializeDecimal(item.quantity),
        unit: item.unit,
        ingredient: item.ingredient,
      })),
    };
  }

  async create(tenant: TenantContext, dto: CreateRecipeDto) {
    RecipeCostService.validateYieldQuantity(dto.yieldQuantity);
    this.validateItems(dto.items);

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        organizationId: tenant.organizationId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingRecipe = await this.prisma.recipe.findFirst({
      where: {
        productId: dto.productId,
        organizationId: tenant.organizationId,
      },
      select: { id: true },
    });

    if (existingRecipe) {
      throw new ConflictException('Product already has a recipe');
    }

    await this.validateIngredients(tenant.organizationId, dto.items);

    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          organizationId: tenant.organizationId,
          productId: dto.productId,
          name: normalizeName(dto.name),
          yieldQuantity: toDecimal(dto.yieldQuantity),
          yieldUnit: dto.yieldUnit,
          items: {
            create: dto.items.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: toDecimal(item.quantity),
              unit: item.unit,
            })),
          },
        },
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
              id: true,
              ingredientId: true,
              quantity: true,
              unit: true,
              ingredient: {
                select: { id: true, name: true, sku: true, baseUnit: true },
              },
            },
          },
        },
      });

      const mapped = this.mapRecipeDetail(recipe);
      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.CREATE,
          entityType: 'Recipe',
          entityId: mapped.id,
          entityLabel: mapped.name,
          after: mapped,
        },
        tx,
      );

      return mapped;
    });
  }

  async update(tenant: TenantContext, id: string, dto: UpdateRecipeDto) {
    const beforeRecipe = await this.prisma.recipe.findFirst({
      where: { id, organizationId: tenant.organizationId },
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
            id: true,
            ingredientId: true,
            quantity: true,
            unit: true,
            ingredient: {
              select: { id: true, name: true, sku: true, baseUnit: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!beforeRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    const existing = beforeRecipe;

    if (dto.yieldQuantity !== undefined) {
      RecipeCostService.validateYieldQuantity(dto.yieldQuantity);
    }

    if (dto.items) {
      this.validateItems(dto.items);
      await this.validateIngredients(tenant.organizationId, dto.items);
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.RecipeUpdateInput = {};

      if (dto.name !== undefined) {
        data.name = normalizeName(dto.name);
      }

      if (dto.yieldQuantity !== undefined) {
        data.yieldQuantity = toDecimal(dto.yieldQuantity);
      }

      if (dto.yieldUnit !== undefined) {
        data.yieldUnit = dto.yieldUnit;
      }

      await tx.recipe.update({
        where: { id: existing.id },
        data,
      });

      if (dto.items) {
        await tx.recipeItem.deleteMany({ where: { recipeId: existing.id } });
        await tx.recipeItem.createMany({
          data: dto.items.map((item) => ({
            recipeId: existing.id,
            ingredientId: item.ingredientId,
            quantity: toDecimal(item.quantity),
            unit: item.unit,
          })),
        });
      }

      const recipe = await tx.recipe.findUniqueOrThrow({
        where: { id: existing.id },
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
              id: true,
              ingredientId: true,
              quantity: true,
              unit: true,
              ingredient: {
                select: { id: true, name: true, sku: true, baseUnit: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const mapped = this.mapRecipeDetail(recipe);
      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.UPDATE,
          entityType: 'Recipe',
          entityId: mapped.id,
          entityLabel: mapped.name,
          before: this.mapRecipeDetail(beforeRecipe),
          after: mapped,
        },
        tx,
      );

      return mapped;
    });
  }

  calculateCost(tenant: TenantContext, recipeId: string, branchId: string) {
    return this.recipeCostService.calculate(tenant, recipeId, branchId);
  }

  private validateItems(items: CreateRecipeItemDto[]) {
    const ingredientIds = items.map((item) => item.ingredientId);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestException('Duplicate ingredient in recipe items');
    }

    for (const item of items) {
      RecipeCostService.validateItemQuantity(item.quantity);
    }
  }

  private async validateIngredients(
    organizationId: string,
    items: CreateRecipeItemDto[],
  ): Promise<void> {
    const ingredientIds = [...new Set(items.map((item) => item.ingredientId))];

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        organizationId,
        isActive: true,
      },
      select: { id: true, baseUnit: true },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new NotFoundException('One or more ingredients not found');
    }

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    for (const item of items) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (ingredient && ingredient.baseUnit !== item.unit) {
        throw new BadRequestException(
          `Unit mismatch for ingredient ${item.ingredientId}: expected ${ingredient.baseUnit}`,
        );
      }
    }
  }

  private mapRecipeDetail(
    recipe: Prisma.RecipeGetPayload<{
      include: {
        product: {
          select: {
            id: true;
            name: true;
            sku: true;
            defaultServingCount: true;
          };
        };
        items: {
          select: {
            id: true;
            ingredientId: true;
            quantity: true;
            unit: true;
            ingredient: {
              select: { id: true; name: true; sku: true; baseUnit: true };
            };
          };
        };
      };
    }>,
  ) {
    return {
      id: recipe.id,
      productId: recipe.productId,
      name: recipe.name,
      yieldQuantity: serializeDecimal(recipe.yieldQuantity),
      yieldUnit: recipe.yieldUnit,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      product: {
        ...recipe.product,
        defaultServingCount: String(recipe.product.defaultServingCount),
      },
      items: recipe.items.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantity: serializeDecimal(item.quantity),
        unit: item.unit,
        ingredient: item.ingredient,
      })),
    };
  }
}
