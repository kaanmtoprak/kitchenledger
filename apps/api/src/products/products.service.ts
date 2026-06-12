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
import { normalizeName, normalizeSku } from '../common/utils/normalize.util';
import { RecipeCostService } from '../recipes/recipe-cost.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productSelect = {
  id: true,
  name: true,
  sku: true,
  description: true,
  defaultServingCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeCostService: RecipeCostService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenant: TenantContext, query: ListProductsQueryDto) {
    const pagination = parsePagination(query);
    const where: Prisma.ProductWhereInput = {
      organizationId: tenant.organizationId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { sku: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedResponse(
      rows.map((row) => this.mapProduct(row)),
      total,
      pagination,
    );
  }

  async findOne(tenant: TenantContext, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: {
        ...productSelect,
        recipes: {
          take: 1,
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { recipes, ...rest } = product;

    return {
      ...this.mapProduct(rest),
      recipe: recipes[0]
        ? {
            id: recipes[0].id,
            name: recipes[0].name,
            yieldQuantity: recipes[0].yieldQuantity.toString(),
            yieldUnit: recipes[0].yieldUnit,
            createdAt: recipes[0].createdAt,
          }
        : null,
    };
  }

  async create(tenant: TenantContext, dto: CreateProductDto) {
    const name = normalizeName(dto.name);
    const sku = normalizeSku(dto.sku);

    await this.assertSkuAvailable(tenant.organizationId, sku);

    const product = await this.prisma.product.create({
      data: {
        organizationId: tenant.organizationId,
        name,
        sku,
        description: dto.description?.trim() || null,
        defaultServingCount: dto.defaultServingCount ?? 1,
      },
      select: productSelect,
    });

    const mapped = this.mapProduct(product);
    await this.auditService.logFromTenant(tenant, {
      action: AuditAction.CREATE,
      entityType: 'Product',
      entityId: mapped.id,
      entityLabel: mapped.name,
      after: mapped,
    });

    return mapped;
  }

  async update(tenant: TenantContext, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: productSelect,
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = normalizeName(dto.name);
    }

    if (dto.sku !== undefined) {
      const sku = normalizeSku(dto.sku);
      if (sku !== existing.sku) {
        await this.assertSkuAvailable(tenant.organizationId, sku, id);
      }
      data.sku = sku;
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.defaultServingCount !== undefined) {
      data.defaultServingCount = dto.defaultServingCount;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const product = await this.prisma.product.update({
      where: { id: existing.id },
      data,
      select: productSelect,
    });

    const before = this.mapProduct(existing);
    const after = this.mapProduct(product);
    let action: AuditAction = AuditAction.UPDATE;
    if (dto.isActive === false && existing.isActive) {
      action = AuditAction.DEACTIVATE;
    } else if (dto.isActive === true && !existing.isActive) {
      action = AuditAction.ACTIVATE;
    }

    await this.auditService.logFromTenant(tenant, {
      action,
      entityType: 'Product',
      entityId: after.id,
      entityLabel: after.name,
      before,
      after,
    });

    return after;
  }

  async softDelete(tenant: TenantContext, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: productSelect,
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await this.auditService.logFromTenant(tenant, {
      action: AuditAction.DEACTIVATE,
      entityType: 'Product',
      entityId: existing.id,
      entityLabel: existing.name,
      before: { isActive: true },
      after: { isActive: false },
    });

    return { success: true };
  }

  async calculateCost(
    tenant: TenantContext,
    productId: string,
    branchId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId: tenant.organizationId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const recipe = await this.prisma.recipe.findFirst({
      where: { productId, organizationId: tenant.organizationId },
      select: { id: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return this.recipeCostService.calculate(tenant, recipe.id, branchId);
  }

  private mapProduct(
    product: Prisma.ProductGetPayload<{ select: typeof productSelect }>,
  ) {
    return {
      ...product,
      defaultServingCount: String(product.defaultServingCount),
    };
  }

  private async assertSkuAvailable(
    organizationId: string,
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: {
        organizationId,
        sku,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Product SKU already exists');
    }
  }
}
