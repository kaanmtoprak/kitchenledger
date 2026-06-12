import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  BaseUnit,
  Prisma,
  PurchaseStatus,
  StockMovementType,
} from '@kitchenledger/db';
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
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
    private readonly auditService: AuditService,
  ) {}

  private mapPurchaseBase(row: {
    id: string;
    branchId: string;
    supplierId: string | null;
    purchasedAt: Date;
    invoiceNumber: string | null;
    notes: string | null;
    status: PurchaseStatus;
    cancelledAt: Date | null;
    cancelledByUserId: string | null;
    cancellationReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      branchId: row.branchId,
      supplierId: row.supplierId,
      purchasedAt: row.purchasedAt,
      invoiceNumber: row.invoiceNumber,
      notes: row.notes,
      status: row.status,
      cancelledAt: row.cancelledAt,
      cancellationReason: row.cancellationReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

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
        ...this.mapPurchaseBase(purchase),
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
      ...(query.status ? { status: query.status } : {}),
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
            status: true,
            cancelledAt: true,
            cancelledByUserId: true,
            cancellationReason: true,
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
        ...this.mapPurchaseBase(row),
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
          status: true,
          cancelledAt: true,
          cancelledByUserId: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { purchasedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return buildPaginatedResponse(
      rows.map((row) => this.mapPurchaseBase(row)),
      total,
      pagination,
    );
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
            stockBatch: {
              select: {
                id: true,
                initialQuantity: true,
                remainingQuantity: true,
              },
            },
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
      ...this.mapPurchaseBase(purchase),
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

  async cancel(tenant: TenantContext, id: string, dto: CancelPurchaseDto) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        items: {
          include: {
            stockBatch: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    await this.branchAccessService.ensureBranchAccess(tenant, purchase.branchId);

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('This purchase has already been cancelled');
    }

    for (const item of purchase.items) {
      const batch = item.stockBatch;
      if (!batch) {
        continue;
      }

      if (!batch.initialQuantity.equals(batch.remainingQuantity)) {
        throw new ConflictException(
          'This purchase cannot be cancelled because stock from its batches has been consumed',
        );
      }
    }

    const reason = dto.reason.trim();
    const beforeSnapshot = {
      status: purchase.status,
      cancellationReason: purchase.cancellationReason,
    };

    return this.prisma.$transaction(async (tx) => {
      const affectedBatchIds: string[] = [];
      let totalReversedQuantity = toDecimal('0');

      for (const item of purchase.items) {
        const batch = item.stockBatch;
        if (!batch) {
          continue;
        }

        const quantityToReverse = batch.remainingQuantity;
        affectedBatchIds.push(batch.id);

        await tx.stockBatch.update({
          where: { id: batch.id },
          data: { remainingQuantity: toDecimal('0') },
        });

        if (quantityToReverse.gt(0)) {
          await tx.stockMovement.create({
            data: {
              organizationId: tenant.organizationId,
              branchId: purchase.branchId,
              ingredientId: batch.ingredientId,
              stockBatchId: batch.id,
              type: StockMovementType.MANUAL_ADJUSTMENT,
              quantity: quantityToReverse,
              unit: batch.unit,
              reason: `Satın alma iptali: ${reason}`,
            },
          });

          totalReversedQuantity = totalReversedQuantity.add(quantityToReverse);
        }
      }

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: PurchaseStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledByUserId: tenant.userId,
          cancellationReason: reason,
        },
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

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.STATUS_CHANGE,
          entityType: 'Purchase',
          entityId: updated.id,
          entityLabel: updated.invoiceNumber ?? updated.id,
          branchId: updated.branchId,
          before: beforeSnapshot,
          after: {
            status: updated.status,
            cancellationReason: updated.cancellationReason,
          },
          metadata: {
            invoiceNumber: updated.invoiceNumber,
            reason,
            affectedBatchIds,
            totalReversedQuantity: serializeDecimal(totalReversedQuantity),
          },
        },
        tx,
      );

      return {
        ...this.mapPurchaseBase(updated),
        branch: updated.branch,
        supplier: updated.supplier,
        items: updated.items.map((item) => ({
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
    });
  }
}
