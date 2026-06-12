import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, OrderStatus, Prisma } from '@kitchenledger/db';
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
  CreateOrderDto,
  validateOrderItemDecimals,
} from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchAccessService: BranchAccessService,
    private readonly auditService: AuditService,
  ) {}

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
    orderedAt: Date,
  ): Promise<string> {
    const year = orderedAt.getFullYear();
    const prefix = `ORD-${year}-`;
    const count = await tx.order.count({
      where: {
        organizationId,
        orderNumber: { startsWith: prefix },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private mapOrderAuditSnapshot(order: {
    customer: {
      name: string;
      phone: string | null;
      email: string | null;
    } | null;
    dueDate: Date | null;
    notes: string | null;
    totalAmount: Prisma.Decimal;
    items: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
      product?: { name: string } | null;
    }>;
  }) {
    return {
      customer: order.customer
        ? {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
          }
        : null,
      dueAt: order.dueDate?.toISOString() ?? null,
      notes: order.notes,
      totalAmount: serializeDecimal(order.totalAmount)!,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name ?? null,
        quantity: serializeDecimal(item.quantity)!,
        unitPrice: serializeDecimal(item.unitPrice)!,
        totalPrice: serializeDecimal(item.totalPrice)!,
      })),
    };
  }

  private collectChangedAuditFields(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): string[] {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

    return [...keys].filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    );
  }

  private mapOrderItem(item: {
    id: string;
    productId: string;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    product?: { id: string; name: string; sku: string } | null;
  }) {
    return {
      id: item.id,
      productId: item.productId,
      quantity: serializeDecimal(item.quantity)!,
      unitPrice: serializeDecimal(item.unitPrice)!,
      totalPrice: serializeDecimal(item.totalPrice)!,
      ...(item.product ? { product: item.product } : {}),
    };
  }

  private mapOrderListRow(
    row: {
      id: string;
      orderNumber: string;
      branchId: string;
      status: OrderStatus;
      totalAmount: Prisma.Decimal;
      orderedAt: Date;
      dueDate: Date | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      customer: {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
      } | null;
      items?: Array<{
        id: string;
        productId: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        product: { id: string; name: string; sku: string };
      }>;
      _count?: { items: number };
    },
    includeItems: boolean,
  ) {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      branchId: row.branchId,
      status: row.status,
      totalAmount: serializeDecimal(row.totalAmount)!,
      orderedAt: row.orderedAt,
      dueAt: row.dueDate,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: row.customer,
      itemCount: includeItems
        ? (row.items?.length ?? 0)
        : (row._count?.items ?? 0),
      ...(includeItems && row.items
        ? { items: row.items.map((item) => this.mapOrderItem(item)) }
        : {}),
    };
  }

  async create(tenant: TenantContext, dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate product in order items');
    }

    for (const item of dto.items) {
      try {
        validateOrderItemDecimals(item);
      } catch {
        throw new BadRequestException('Invalid quantity or unit price');
      }
    }

    await this.branchAccessService.ensureBranchAccess(tenant, dto.branchId);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: [...uniqueProductIds] },
        organizationId: tenant.organizationId,
        isActive: true,
      },
      select: { id: true },
    });

    if (products.length !== uniqueProductIds.size) {
      throw new NotFoundException('One or more products not found');
    }

    const orderedAt = dto.orderedAt ? new Date(dto.orderedAt) : new Date();
    const dueDate = dto.dueAt ? new Date(dto.dueAt) : null;

    const itemRows = dto.items.map((item) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unitPrice);
      const totalPrice = quantity.mul(unitPrice);
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = itemRows.reduce(
      (sum, item) => sum.add(item.totalPrice),
      toDecimal('0'),
    );

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          organizationId: tenant.organizationId,
          name: dto.customer.name.trim(),
          phone: dto.customer.phone?.trim() || null,
          email: dto.customer.email?.trim() || null,
        },
      });

      const orderNumber = await this.generateOrderNumber(
        tx,
        tenant.organizationId,
        orderedAt,
      );

      const order = await tx.order.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: dto.branchId,
          customerId: customer.id,
          orderNumber,
          status: OrderStatus.PENDING,
          totalAmount,
          orderedAt,
          dueDate,
          notes: dto.notes?.trim() || null,
          items: {
            create: itemRows,
          },
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      const result = {
        id: order.id,
        orderNumber: order.orderNumber,
        branchId: order.branchId,
        status: order.status,
        totalAmount: serializeDecimal(order.totalAmount)!,
        orderedAt: order.orderedAt,
        dueAt: order.dueDate,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.customer,
        branch: order.branch,
        items: order.items.map((item) => this.mapOrderItem(item)),
      };

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.CREATE,
          entityType: 'Order',
          entityId: order.id,
          entityLabel: order.orderNumber,
          branchId: order.branchId,
          after: result,
          metadata: {
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: result.totalAmount,
            itemCount: order.items.length,
          },
        },
        tx,
      );

      return result;
    });
  }

  async list(tenant: TenantContext, query: ListOrdersQueryDto) {
    const pagination = parsePagination(query);
    const branchFilter = await this.branchAccessService.resolveBranchFilter(
      tenant,
      query.branchId,
    );

    const where: Prisma.OrderWhereInput = {
      organizationId: tenant.organizationId,
      ...(branchFilter !== undefined ? { branchId: branchFilter } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            orderedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { orderNumber: { contains: query.q, mode: 'insensitive' } },
              {
                customer: {
                  name: { contains: query.q, mode: 'insensitive' },
                },
              },
              {
                customer: {
                  phone: { contains: query.q, mode: 'insensitive' },
                },
              },
              {
                customer: {
                  email: { contains: query.q, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    if (query.includeItems) {
      const [rows, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          select: {
            id: true,
            orderNumber: true,
            branchId: true,
            status: true,
            totalAmount: true,
            orderedAt: true,
            dueDate: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: { id: true, name: true, phone: true, email: true },
            },
            items: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                product: { select: { id: true, name: true, sku: true } },
              },
            },
          },
          orderBy: { orderedAt: 'desc' },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      const data = rows.map((row) => this.mapOrderListRow(row, true));
      return buildPaginatedResponse(data, total, pagination);
    }

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          branchId: true,
          status: true,
          totalAmount: true,
          orderedAt: true,
          dueDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          _count: { select: { items: true } },
        },
        orderBy: { orderedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const data = rows.map((row) => this.mapOrderListRow(row, false));

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(tenant: TenantContext, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.branchAccessService.ensureBranchAccess(tenant, order.branchId);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      status: order.status,
      totalAmount: serializeDecimal(order.totalAmount)!,
      orderedAt: order.orderedAt,
      dueAt: order.dueDate,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.customer,
      branch: order.branch,
      items: order.items.map((item) => this.mapOrderItem(item)),
    };
  }

  async update(tenant: TenantContext, id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    await this.branchAccessService.ensureBranchAccess(
      tenant,
      existing.branchId,
    );

    if (
      existing.status === OrderStatus.DELIVERED ||
      existing.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Completed or cancelled orders cannot be edited',
      );
    }

    const beforeSnapshot = this.mapOrderAuditSnapshot(existing);

    const productIds = dto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate product in order items');
    }

    for (const item of dto.items) {
      try {
        validateOrderItemDecimals(item);
      } catch {
        throw new BadRequestException('Invalid quantity or unit price');
      }
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: [...uniqueProductIds] },
        organizationId: tenant.organizationId,
        isActive: true,
      },
      select: { id: true },
    });

    if (products.length !== uniqueProductIds.size) {
      throw new NotFoundException('One or more products not found');
    }

    const dueDate = dto.dueAt ? new Date(dto.dueAt) : null;

    const itemRows = dto.items.map((item) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unitPrice);
      const totalPrice = quantity.mul(unitPrice);
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = itemRows.reduce(
      (sum, item) => sum.add(item.totalPrice),
      toDecimal('0'),
    );

    return this.prisma.$transaction(async (tx) => {
      if (existing.customerId) {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: {
            name: dto.customer.name.trim(),
            phone: dto.customer.phone?.trim() || null,
            email: dto.customer.email?.trim() || null,
          },
        });
      }

      await tx.orderItem.deleteMany({ where: { orderId: existing.id } });

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          totalAmount,
          dueDate,
          notes: dto.notes?.trim() || null,
          items: {
            create: itemRows,
          },
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      const afterSnapshot = this.mapOrderAuditSnapshot(updated);
      const changedFields = this.collectChangedAuditFields(
        beforeSnapshot as Record<string, unknown>,
        afterSnapshot as Record<string, unknown>,
      );

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.UPDATE,
          entityType: 'Order',
          entityId: updated.id,
          entityLabel: updated.orderNumber,
          branchId: updated.branchId,
          before: beforeSnapshot,
          after: afterSnapshot,
          metadata: {
            orderNumber: updated.orderNumber,
            changedFields,
            itemCountBefore: beforeSnapshot.items.length,
            itemCountAfter: afterSnapshot.items.length,
          },
        },
        tx,
      );

      return {
        id: updated.id,
        orderNumber: updated.orderNumber,
        branchId: updated.branchId,
        status: updated.status,
        totalAmount: serializeDecimal(updated.totalAmount)!,
        orderedAt: updated.orderedAt,
        dueAt: updated.dueDate,
        notes: updated.notes,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        customer: updated.customer,
        branch: updated.branch,
        items: updated.items.map((item) => this.mapOrderItem(item)),
      };
    });
  }

  async updateStatus(
    tenant: TenantContext,
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: {
        id: true,
        branchId: true,
        orderNumber: true,
        status: true,
        customer: { select: { name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.branchAccessService.ensureBranchAccess(tenant, order.branchId);

    if (order.status === dto.status) {
      return this.findOne(tenant, id);
    }

    const previousStatus = order.status;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: dto.status },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      await this.auditService.logFromTenant(
        tenant,
        {
          action: AuditAction.STATUS_CHANGE,
          entityType: 'Order',
          entityId: updated.id,
          entityLabel: updated.orderNumber,
          branchId: updated.branchId,
          before: { status: previousStatus },
          after: { status: updated.status },
          metadata: {
            orderNumber: updated.orderNumber,
            customerName: order.customer?.name ?? null,
          },
        },
        tx,
      );

      return {
        id: updated.id,
        orderNumber: updated.orderNumber,
        branchId: updated.branchId,
        status: updated.status,
        totalAmount: serializeDecimal(updated.totalAmount)!,
        orderedAt: updated.orderedAt,
        dueAt: updated.dueDate,
        notes: updated.notes,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        customer: updated.customer,
        branch: updated.branch,
        items: updated.items.map((item) => this.mapOrderItem(item)),
      };
    });
  }
}
