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
import { TenantContext } from '../common/types/tenant-context.type';
import { serializeDecimal, toDecimal } from '../common/utils/decimal.util';
import {
  CreatePurchaseDto,
  validatePurchaseItemDecimals,
} from './dto/create-purchase.dto';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenant: TenantContext, dto: CreatePurchaseDto) {
    const ingredientIds = dto.items.map((item) => item.ingredientId);
    const uniqueIngredientIds = new Set(ingredientIds);
    if (uniqueIngredientIds.size !== ingredientIds.length) {
      throw new BadRequestException('Duplicate ingredient in purchase items');
    }

    for (const item of dto.items) {
      try {
        validatePurchaseItemDecimals(item);
      } catch {
        throw new BadRequestException('Invalid quantity or total price');
      }
    }

    await this.branchAccessService.ensureBranchAccess(tenant, dto.branchId);

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: dto.supplierId,
          organizationId: tenant.organizationId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        id: { in: [...uniqueIngredientIds] },
        organizationId: tenant.organizationId,
        isActive: true,
      },
      select: { id: true, baseUnit: true },
    });

    if (ingredients.length !== uniqueIngredientIds.size) {
      throw new NotFoundException('One or more ingredients not found');
    }

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    for (const item of dto.items) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (ingredient && ingredient.baseUnit !== item.unit) {
        throw new BadRequestException(
          `Unit mismatch for ingredient ${item.ingredientId}: expected ${ingredient.baseUnit}`,
        );
      }
    }

    const purchasedAt = dto.purchasedAt
      ? new Date(dto.purchasedAt)
      : new Date();

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: dto.branchId,
          supplierId: dto.supplierId ?? null,
          purchasedAt,
          invoiceNumber: dto.invoiceNumber?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
      });

      const responseItems: Array<{
        id: string;
        ingredientId: string;
        quantity: string;
        unit: BaseUnit;
        totalPrice: string;
        unitCost: string;
        stockBatchId: string;
      }> = [];

      for (const item of dto.items) {
        const quantity = toDecimal(item.quantity);
        const totalPrice = toDecimal(item.totalPrice);
        const unitCost = totalPrice.div(quantity);

        const purchaseItem = await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            ingredientId: item.ingredientId,
            quantity,
            unit: item.unit,
            totalPrice,
          },
        });

        const stockBatch = await tx.stockBatch.create({
          data: {
            organizationId: tenant.organizationId,
            branchId: dto.branchId,
            ingredientId: item.ingredientId,
            purchaseItemId: purchaseItem.id,
            initialQuantity: quantity,
            remainingQuantity: quantity,
            unit: item.unit,
            unitCost,
            receivedAt: purchasedAt,
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId: tenant.organizationId,
            branchId: dto.branchId,
            ingredientId: item.ingredientId,
            stockBatchId: stockBatch.id,
            type: StockMovementType.PURCHASE,
            quantity,
            unit: item.unit,
            reason: 'Purchase received',
          },
        });

        responseItems.push({
          id: purchaseItem.id,
          ingredientId: purchaseItem.ingredientId,
          quantity: serializeDecimal(purchaseItem.quantity)!,
          unit: purchaseItem.unit,
          totalPrice: serializeDecimal(purchaseItem.totalPrice)!,
          unitCost: serializeDecimal(unitCost)!,
          stockBatchId: stockBatch.id,
        });
      }

      const result = {
        id: purchase.id,
        branchId: purchase.branchId,
        supplierId: purchase.supplierId,
        purchasedAt: purchase.purchasedAt,
        invoiceNumber: purchase.invoiceNumber,
        notes: purchase.notes,
        items: responseItems,
      };

      const totalCost = responseItems.reduce(
        (sum, item) => sum.add(toDecimal(item.totalPrice)),
        toDecimal('0'),
      );

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.CREATE,
          entityType: 'Purchase',
          entityId: purchase.id,
          entityLabel: purchase.invoiceNumber ?? purchase.id,
          branchId: purchase.branchId,
          after: result,
          metadata: {
            invoiceNumber: purchase.invoiceNumber,
            totalCost: serializeDecimal(totalCost),
            itemCount: responseItems.length,
          },
        },
        tx,
      );

      return result;
    });
  }

  async list(tenant: TenantContext, query: ListPurchasesQueryDto) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    if (query.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: query.supplierId, organizationId: tenant.organizationId },
        select: { id: true },
      });
      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const where: Prisma.PurchaseWhereInput = {
      organizationId: tenant.organizationId,
      ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.from || query.to
        ? {
            purchasedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            invoiceNumber: { contains: query.q, mode: 'insensitive' },
          }
        : {}),
    };

    if (query.includeItems) {
      const [rows, total] = await Promise.all([
        this.prisma.purchase.findMany({
          where,
          select: {
            id: true,
            branchId: true,
            supplierId: true,
            purchasedAt: true,
            invoiceNumber: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                ingredientId: true,
                quantity: true,
                unit: true,
                totalPrice: true,
                ingredient: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
          orderBy: { purchasedAt: 'desc' },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        this.prisma.purchase.count({ where }),
      ]);

      const data = rows.map((row) => ({
        id: row.id,
        branchId: row.branchId,
        supplierId: row.supplierId,
        purchasedAt: row.purchasedAt,
        invoiceNumber: row.invoiceNumber,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        items: row.items.map((item) => ({
          id: item.id,
          ingredientId: item.ingredientId,
          quantity: serializeDecimal(item.quantity),
          unit: item.unit,
          totalPrice: serializeDecimal(item.totalPrice),
          ingredient: item.ingredient,
        })),
      }));

      return buildPaginatedResponse(data, total, pagination);
    }

    const [rows, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          supplierId: true,
          purchasedAt: true,
          invoiceNumber: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { purchasedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return buildPaginatedResponse(rows, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        supplier: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            ingredientId: true,
            quantity: true,
            unit: true,
            totalPrice: true,
            ingredient: {
              select: { id: true, name: true, sku: true, baseUnit: true },
            },
            stockBatch: { select: { id: true } },
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    await this.branchAccessService.ensureBranchAccess(
      tenant,
      purchase.branchId,
    );

    return {
      id: purchase.id,
      branchId: purchase.branchId,
      supplierId: purchase.supplierId,
      purchasedAt: purchase.purchasedAt,
      invoiceNumber: purchase.invoiceNumber,
      notes: purchase.notes,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      branch: purchase.branch,
      supplier: purchase.supplier,
      items: purchase.items.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantity: serializeDecimal(item.quantity),
        unit: item.unit,
        totalPrice: serializeDecimal(item.totalPrice),
        unitCost: serializeDecimal(item.totalPrice.div(item.quantity)),
        stockBatchId: item.stockBatch?.id ?? null,
        ingredient: item.ingredient,
      })),
    };
  }
}
