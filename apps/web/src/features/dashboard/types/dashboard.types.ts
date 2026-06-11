export type DashboardQueryParams = {
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type DashboardDateRangePreset = '7d' | '30d' | '90d';

export type DashboardFilters = {
  preset: DashboardDateRangePreset;
  branchId?: string;
};

export type DashboardSummary = {
  range: {
    from: string;
    to: string;
  };
  branches: {
    count: number;
  };
  inventory: {
    totalStockValue: string;
    lowStockIngredientCount: number;
    activeIngredientCount: number;
  };
  purchases: {
    totalPurchaseCost: string;
    purchaseCount: number;
  };
  production: {
    productionCount: number;
    totalProducedQuantity: string;
    totalProductionCost: string;
    averageProductionUnitCost: string;
  };
  products: {
    activeProductCount: number;
  };
};

export type LowStockItem = {
  branchId: string;
  branchName: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  totalRemaining: string;
  minimumStockLevel: string;
  shortage: string;
  isOutOfStock: boolean;
};

export type LowStockResponse = {
  data: LowStockItem[];
};

export type ProductionTrendItem = {
  date: string;
  productionCount: number;
  totalCost: string;
  totalQuantity: string;
};

export type ProductionTrendResponse = {
  data: ProductionTrendItem[];
};

export type TopProductByCost = {
  productId: string;
  productName: string;
  productSku: string;
  productionCount: number;
  totalProducedQuantity: string;
  totalProductionCost: string;
  averageUnitCost: string;
};

export type TopProductsByCostResponse = {
  data: TopProductByCost[];
};

export type PurchaseSummaryBySupplier = {
  supplierId: string | null;
  supplierName: string;
  purchaseCount: number;
  totalPurchaseCost: string;
};

export type PurchaseSummaryBySupplierResponse = {
  data: PurchaseSummaryBySupplier[];
};

export type RecentActivityType = 'PRODUCTION' | 'PURCHASE';

export type RecentActivityItem = {
  type: RecentActivityType;
  id: string;
  title: string;
  description: string;
  branchId: string;
  branchName: string;
  createdAt: string;
};

export type RecentActivityResponse = {
  data: RecentActivityItem[];
};
