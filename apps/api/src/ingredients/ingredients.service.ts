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
import { serializeDecimal, toDecimal } from '../common/utils/decimal.util';
import { normalizeName, normalizeSku } from '../common/utils/normalize.util';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { ListIngredientsQueryDto } from './dto/list-ingredients-query.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

const ingredientSelect = {
  id: true,
  name: true,
  sku: true,
  baseUnit: true,
  minimumStockLevel: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IngredientSelect;

type IngredientRow = Prisma.IngredientGetPayload<{
  select: typeof ingredientSelect;
}>;

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenant: TenantContext, query: ListIngredientsQueryDto) {
    const pagination = parsePagination(query);
    const where: Prisma.IngredientWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.baseUnit ? { baseUnit: query.baseUnit } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { sku: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        select: ingredientSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return buildPaginatedResponse(
      rows.map((row) => this.mapIngredient(row)),
      total,
      pagination,
    );
  }

  async findOne(tenant: TenantContext, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: ingredientSelect,
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return this.mapIngredient(ingredient);
  }

  async create(tenant: TenantContext, dto: CreateIngredientDto) {
    const name = normalizeName(dto.name);
    const sku = normalizeSku(dto.sku);

    await this.assertSkuAvailable(tenant.organizationId, sku);
    await this.assertNameAvailable(tenant.organizationId, name);

    const ingredient = await this.prisma.ingredient.create({
      data: {
        organizationId: tenant.organizationId,
        name,
        sku,
        baseUnit: dto.baseUnit,
        minimumStockLevel:
          dto.minimumStockLevel !== undefined && dto.minimumStockLevel !== null
            ? toDecimal(dto.minimumStockLevel)
            : null,
      },
      select: ingredientSelect,
    });

    return this.mapIngredient(ingredient);
  }

  async update(tenant: TenantContext, id: string, dto: UpdateIngredientDto) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: { id: true, name: true, sku: true },
    });

    if (!existing) {
      throw new NotFoundException('Ingredient not found');
    }

    const data: Prisma.IngredientUpdateInput = {};

    if (dto.name !== undefined) {
      const name = normalizeName(dto.name);
      if (name.toLowerCase() !== existing.name.toLowerCase()) {
        await this.assertNameAvailable(tenant.organizationId, name, id);
      }
      data.name = name;
    }

    if (dto.sku !== undefined) {
      const sku = normalizeSku(dto.sku);
      if (sku !== existing.sku) {
        await this.assertSkuAvailable(tenant.organizationId, sku, id);
      }
      data.sku = sku;
    }

    if (dto.baseUnit !== undefined) {
      data.baseUnit = dto.baseUnit;
    }

    if (dto.minimumStockLevel !== undefined) {
      data.minimumStockLevel =
        dto.minimumStockLevel === null
          ? null
          : toDecimal(dto.minimumStockLevel);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const ingredient = await this.prisma.ingredient.update({
      where: { id: existing.id },
      data,
      select: ingredientSelect,
    });

    return this.mapIngredient(ingredient);
  }

  async softDelete(tenant: TenantContext, id: string) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Ingredient not found');
    }

    await this.prisma.ingredient.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  private mapIngredient(ingredient: IngredientRow) {
    return {
      ...ingredient,
      minimumStockLevel: serializeDecimal(ingredient.minimumStockLevel),
    };
  }

  private async assertSkuAvailable(
    organizationId: string,
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.ingredient.findFirst({
      where: {
        organizationId,
        sku,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Ingredient SKU already exists');
    }
  }

  private async assertNameAvailable(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.ingredient.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Ingredient name already exists');
    }
  }
}
