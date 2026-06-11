import type { PaginatedResponse } from '@/features/branches/types/branch.types';

export type StockMovementType =
  | 'PURCHASE'
  | 'PRODUCTION_CONSUMPTION'
  | 'MANUAL_ADJUSTMENT'
  | 'WASTE'
  | 'RETURN';

export type StockSummaryItem = {
  branchId: string;
  branchName: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  totalRemaining: string;
  weightedAverageUnitCost: string;
  totalValue: string;
  minimumStockLevel: string | null;
  isLowStock: boolean;
};

export type StockBatchItem = {
  id: string;
  branchId: string;
  ingredientId: string;
  initialQuantity: string;
  remainingQuantity: string;
  unit: string;
  unitCost: string;
  receivedAt: string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  ingredient: {
    id: string;
    name: string;
    sku: string;
    baseUnit: string;
  };
};

export type StockMovementItem = {
  id: string;
  branchId: string;
  ingredientId: string;
  stockBatchId: string | null;
  type: StockMovementType;
  quantity: string;
  unit: string;
  reason: string | null;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  ingredient: {
    id: string;
    name: string;
    sku: string;
  };
  stockBatch: {
    id: string;
    receivedAt: string;
  } | null;
};

export type ListStockParams = {
  page?: number;
  limit?: number;
  q?: string;
  branchId?: string;
  ingredientId?: string;
  lowStockOnly?: boolean;
};

export type ListStockBatchesParams = {
  page?: number;
  limit?: number;
  branchId?: string;
  ingredientId?: string;
  onlyAvailable?: boolean;
};

export type ListStockMovementsParams = {
  page?: number;
  limit?: number;
  branchId?: string;
  ingredientId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
};

export type StockListResponse = PaginatedResponse<StockSummaryItem>;
export type StockBatchesListResponse = PaginatedResponse<StockBatchItem>;
export type StockMovementsListResponse = PaginatedResponse<StockMovementItem>;

export type InventoryTab = 'stock' | 'batches' | 'movements';
