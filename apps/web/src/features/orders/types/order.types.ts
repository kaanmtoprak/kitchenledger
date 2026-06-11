import type { PaginatedResponse } from '@/features/branches/types/branch.types';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type OrderProductRef = {
  id: string;
  name: string;
  sku: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  product?: OrderProductRef;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  branchId: string;
  status: OrderStatus;
  totalAmount: string;
  orderedAt: string;
  dueAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer | null;
  itemCount?: number;
  items?: OrderItem[];
};

export type OrderDetail = OrderListItem & {
  branch: { id: string; name: string; code: string };
  items: OrderItem[];
};

export type ListOrdersParams = {
  page?: number;
  limit?: number;
  q?: string;
  branchId?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
  includeItems?: boolean;
};

export type OrdersListResponse = PaginatedResponse<OrderListItem>;

export type CreateOrderCustomerPayload = {
  name: string;
  phone?: string;
  email?: string;
};

export type CreateOrderItemPayload = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

export type CreateOrderPayload = {
  branchId: string;
  customer: CreateOrderCustomerPayload;
  orderedAt?: string;
  dueAt?: string;
  notes?: string;
  items: CreateOrderItemPayload[];
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
};

export function calculateOrderItemsTotal(
  items: Array<{ quantity: string; unitPrice: string }>,
): number {
  return items.reduce((sum, item) => {
    const quantity = Number.parseFloat(item.quantity);
    const unitPrice = Number.parseFloat(item.unitPrice);
    if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) {
      return sum;
    }
    return sum + quantity * unitPrice;
  }, 0);
}
