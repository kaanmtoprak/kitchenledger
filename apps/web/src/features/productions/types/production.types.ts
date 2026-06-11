import type { PaginatedResponse } from '@/features/branches/types/branch.types';
import type { BaseUnit } from '@/features/ingredients/types/ingredient.types';

export type ProductionListItem = {
  id: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityProduced: string | null;
  totalCostSnapshot: string | null;
  unitCostSnapshot: string | null;
  producedAt: string;
  notes: string | null;
};

export type ProductionConsumptionBatch = {
  stockBatchId: string | null;
  consumedQuantity: string;
  unitCost: string | null;
  cost: string;
  movementId?: string;
};

export type ProductionConsumption = {
  ingredientId: string;
  ingredientName: string;
  quantity: string | null;
  unit: BaseUnit;
  cost: string | null;
  batches: ProductionConsumptionBatch[];
};

export type ProductionDetail = {
  id: string;
  branchId: string;
  productId: string;
  recipeId: string;
  quantityProduced: string | null;
  totalCostSnapshot: string | null;
  unitCostSnapshot: string | null;
  producedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
  };
  recipe: {
    id: string;
    name: string;
    yieldQuantity: string | null;
    yieldUnit: BaseUnit;
  };
  consumptions: ProductionConsumption[];
};

export type ListProductionsParams = {
  page?: number;
  limit?: number;
  q?: string;
  branchId?: string;
  productId?: string;
  from?: string;
  to?: string;
};

export type CreateProductionPayload = {
  branchId: string;
  productId: string;
  quantityProduced: string;
  producedAt?: string;
  notes?: string;
};

export type ProductionsListResponse = PaginatedResponse<ProductionListItem>;

export function calculateEstimatedProductionCost(
  unitCost: string | null | undefined,
  quantityProduced: string,
): { estimatedUnitCost: number | null; estimatedTotalCost: number | null } {
  const qty = Number.parseFloat(quantityProduced);
  const unit = Number.parseFloat(unitCost ?? '');

  if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(unit)) {
    return { estimatedUnitCost: null, estimatedTotalCost: null };
  }

  return {
    estimatedUnitCost: unit,
    estimatedTotalCost: unit * qty,
  };
}

export function formatShortId(id: string | null | undefined): string {
  if (!id) {
    return '—';
  }
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
