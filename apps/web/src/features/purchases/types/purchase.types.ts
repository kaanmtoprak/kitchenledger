import type { PaginatedResponse } from '@/features/branches/types/branch.types';
import type { BaseUnit } from '@/features/ingredients/types/ingredient.types';

export type PurchaseStatus = 'ACTIVE' | 'CANCELLED';

export type PurchaseItemIngredient = {
  id: string;
  name: string;
  sku: string;
  baseUnit?: BaseUnit;
};

export type PurchaseListItem = {
  id: string;
  branchId: string;
  supplierId: string | null;
  purchasedAt: string;
  invoiceNumber: string | null;
  notes: string | null;
  status: PurchaseStatus;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseListItemLine[];
};

export type PurchaseListItemLine = {
  id: string;
  ingredientId: string;
  quantity: string;
  unit: BaseUnit;
  totalPrice: string;
  ingredient: PurchaseItemIngredient;
};

export type PurchaseDetail = Omit<PurchaseListItem, 'items'> & {
  branch: {
    id: string;
    name: string;
    code: string;
  };
  supplier: {
    id: string;
    name: string;
  } | null;
  items: PurchaseDetailItem[];
};

export type PurchaseDetailItem = {
  id: string;
  ingredientId: string;
  quantity: string;
  unit: BaseUnit;
  totalPrice: string;
  unitCost: string;
  stockBatchId: string | null;
  ingredient: PurchaseItemIngredient;
};

export type ListPurchasesParams = {
  page?: number;
  limit?: number;
  branchId?: string;
  supplierId?: string;
  status?: PurchaseStatus;
  from?: string;
  to?: string;
  q?: string;
  includeItems?: boolean;
};

export type CancelPurchasePayload = {
  reason: string;
};

export type CreatePurchaseItemPayload = {
  ingredientId: string;
  quantity: string;
  unit: BaseUnit;
  totalPrice: string;
};

export type CreatePurchasePayload = {
  branchId: string;
  supplierId?: string;
  purchasedAt?: string;
  invoiceNumber?: string;
  notes?: string;
  items: CreatePurchaseItemPayload[];
};

export type PurchasesListResponse = PaginatedResponse<PurchaseListItem>;

export function isPurchaseActive(status: PurchaseStatus): boolean {
  return status === 'ACTIVE';
}

export function calculateItemsTotal(items?: { totalPrice: string }[]): number {
  if (!items?.length) {
    return 0;
  }

  return items.reduce((sum, item) => {
    const value = Number.parseFloat(item.totalPrice);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
}

export function calculateUnitCost(quantity: string, totalPrice: string): number | null {
  const qty = Number.parseFloat(quantity);
  const total = Number.parseFloat(totalPrice);
  if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(total)) {
    return null;
  }
  return total / qty;
}
