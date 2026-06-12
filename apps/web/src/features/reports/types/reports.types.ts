import type { StockMovementType } from '@/features/inventory/types/inventory.types';
import type { OrderStatus } from '@/features/orders/types/order.types';
import type { ProductionStatus } from '@/features/productions/types/production.types';
import type { PurchaseStatus } from '@/features/purchases/types/purchase.types';

export type ReportTabId = 'purchases' | 'productions' | 'movements' | 'orders';

export type ReportDateFilterState = {
  branchId?: string;
  from: string;
  to: string;
};

export type PurchasesReportFilterState = ReportDateFilterState & {
  supplierId?: string;
  status?: PurchaseStatus;
  search: string;
};

export type ProductionsReportFilterState = ReportDateFilterState & {
  productId?: string;
  status?: ProductionStatus;
};

export type StockMovementsReportFilterState = ReportDateFilterState & {
  ingredientId?: string;
  movementType?: StockMovementType;
};

export type OrdersReportFilterState = ReportDateFilterState & {
  status?: OrderStatus;
  search: string;
};
