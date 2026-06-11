'use client';

import { useState } from 'react';
import { DashboardFiltersBar } from '@/features/dashboard/components/dashboard-filters';
import { LowStockCard } from '@/features/dashboard/components/low-stock-card';
import { ProductionTrendChart } from '@/features/dashboard/components/production-trend-chart';
import { PurchaseSummaryCard } from '@/features/dashboard/components/purchase-summary-card';
import { RecentActivityCard } from '@/features/dashboard/components/recent-activity-card';
import { SummaryCards } from '@/features/dashboard/components/summary-cards';
import { TopProductsCard } from '@/features/dashboard/components/top-products-card';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import type { DashboardFilters } from '@/features/dashboard/types/dashboard.types';

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    preset: '30d',
  });

  const {
    branches,
    branchesQuery,
    summaryQuery,
    productionTrendQuery,
    lowStockQuery,
    topProductsQuery,
    purchaseSummaryQuery,
    recentActivityQuery,
  } = useDashboardData(filters);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stok, satın alma ve üretim performansınızı tek ekrandan takip edin.
          </p>
        </div>

        <DashboardFiltersBar
          filters={filters}
          branches={branches}
          isBranchesLoading={branchesQuery.isLoading}
          onChange={setFilters}
        />
      </div>

      <SummaryCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ProductionTrendChart
            data={productionTrendQuery.data?.data}
            isLoading={productionTrendQuery.isLoading}
            isError={productionTrendQuery.isError}
          />
        </div>

        <div className="xl:col-span-4">
          <LowStockCard
            data={lowStockQuery.data?.data}
            isLoading={lowStockQuery.isLoading}
            isError={lowStockQuery.isError}
          />
        </div>

        <div className="xl:col-span-4">
          <TopProductsCard
            data={topProductsQuery.data?.data}
            isLoading={topProductsQuery.isLoading}
            isError={topProductsQuery.isError}
          />
        </div>

        <div className="xl:col-span-4">
          <PurchaseSummaryCard
            data={purchaseSummaryQuery.data?.data}
            isLoading={purchaseSummaryQuery.isLoading}
            isError={purchaseSummaryQuery.isError}
          />
        </div>

        <div className="xl:col-span-4">
          <RecentActivityCard
            data={recentActivityQuery.data?.data}
            isLoading={recentActivityQuery.isLoading}
            isError={recentActivityQuery.isError}
          />
        </div>
      </div>
    </div>
  );
}
