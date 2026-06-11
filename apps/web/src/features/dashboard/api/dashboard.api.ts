import { apiClient } from '@/lib/api/api-client';
import type {
  DashboardQueryParams,
  DashboardSummary,
  LowStockResponse,
  ProductionTrendResponse,
  PurchaseSummaryBySupplierResponse,
  RecentActivityResponse,
  TopProductsByCostResponse,
} from '../types/dashboard.types';

function buildQueryString(params?: DashboardQueryParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();

  if (params.branchId) {
    search.set('branchId', params.branchId);
  }
  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const dashboardApi = {
  getDashboardSummary: (params?: DashboardQueryParams) =>
    apiClient.get<DashboardSummary>(`/dashboard/summary${buildQueryString(params)}`),

  getLowStock: (params?: DashboardQueryParams) =>
    apiClient.get<LowStockResponse>(`/dashboard/low-stock${buildQueryString(params)}`),

  getProductionTrend: (params?: DashboardQueryParams) =>
    apiClient.get<ProductionTrendResponse>(
      `/dashboard/production-trend${buildQueryString(params)}`,
    ),

  getTopProductsByCost: (params?: DashboardQueryParams) =>
    apiClient.get<TopProductsByCostResponse>(
      `/dashboard/top-products-by-cost${buildQueryString(params)}`,
    ),

  getPurchaseSummaryBySupplier: (params?: DashboardQueryParams) =>
    apiClient.get<PurchaseSummaryBySupplierResponse>(
      `/dashboard/purchase-summary-by-supplier${buildQueryString(params)}`,
    ),

  getRecentActivity: (params?: DashboardQueryParams) =>
    apiClient.get<RecentActivityResponse>(`/dashboard/recent-activity${buildQueryString(params)}`),
};
