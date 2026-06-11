'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import type { DashboardFilters } from '@/features/dashboard/types/dashboard.types';
import { getDateRangeFromPreset } from '@/features/dashboard/utils/dashboard-formatters';
import { useAuth } from '@/lib/auth/use-auth';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';

export function useDashboardData(filters: DashboardFilters) {
  const { selectedOrganizationId } = useAuth();

  const dateRange = useMemo(() => getDateRangeFromPreset(filters.preset), [filters.preset]);

  const queryParams = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
    }),
    [dateRange.from, dateRange.to, filters.branchId],
  );

  const enabled = Boolean(selectedOrganizationId);

  const { branches, branchesQuery, hasAccessibleBranches } = useAccessibleBranches({
    queryKeySuffix: 'dashboard',
  });

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary', selectedOrganizationId, queryParams],
    queryFn: () => dashboardApi.getDashboardSummary(queryParams),
    enabled,
  });

  const productionTrendQuery = useQuery({
    queryKey: ['dashboard', 'production-trend', selectedOrganizationId, queryParams],
    queryFn: () => dashboardApi.getProductionTrend(queryParams),
    enabled,
  });

  const lowStockQuery = useQuery({
    queryKey: ['dashboard', 'low-stock', selectedOrganizationId, queryParams],
    queryFn: () => dashboardApi.getLowStock({ ...queryParams, limit: 10 }),
    enabled,
  });

  const topProductsQuery = useQuery({
    queryKey: ['dashboard', 'top-products', selectedOrganizationId, queryParams],
    queryFn: () => dashboardApi.getTopProductsByCost({ ...queryParams, limit: 5 }),
    enabled,
  });

  const purchaseSummaryQuery = useQuery({
    queryKey: ['dashboard', 'purchase-summary', selectedOrganizationId, queryParams],
    queryFn: () => dashboardApi.getPurchaseSummaryBySupplier({ ...queryParams, limit: 5 }),
    enabled,
  });

  const recentActivityQuery = useQuery({
    queryKey: ['dashboard', 'recent-activity', selectedOrganizationId, filters.branchId],
    queryFn: () =>
      dashboardApi.getRecentActivity({
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        limit: 10,
      }),
    enabled,
  });

  return {
    branches,
    branchesQuery,
    hasAccessibleBranches,
    summaryQuery,
    productionTrendQuery,
    lowStockQuery,
    topProductsQuery,
    purchaseSummaryQuery,
    recentActivityQuery,
  };
}
