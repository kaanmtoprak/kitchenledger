import type { StockMovementType } from '@/features/inventory/types/inventory.types';
import type { OrderStatus } from '@/features/orders/types/order.types';

export type ReportTabId = 'purchases' | 'productions' | 'movements' | 'orders';

export type ReportDateFilterState = {
  branchId?: string;
  from: string;
  to: string;
};

export type PurchasesReportFilterState = ReportDateFilterState & {
  supplierId?: string;
  search: string;
};

export type ProductionsReportFilterState = ReportDateFilterState & {
  productId?: string;
};

export type StockMovementsReportFilterState = ReportDateFilterState & {
  ingredientId?: string;
  movementType?: StockMovementType;
};

export type OrdersReportFilterState = ReportDateFilterState & {
  status?: OrderStatus;
  search: string;
};
