'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { TablePagination } from '@/components/common/table-pagination';
import { branchesApi } from '@/features/branches/api/branches.api';
import { ingredientsApi } from '@/features/ingredients/api/ingredients.api';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import {
  InventoryFilters,
  type BatchesFilterState,
  type MovementsFilterState,
  type StockFilterState,
} from '@/features/inventory/components/inventory-filters';
import { InventoryOverviewCards } from '@/features/inventory/components/inventory-overview-cards';
import { InventoryTabs } from '@/features/inventory/components/inventory-tabs';
import { StockBatchesTable } from '@/features/inventory/components/stock-batches-table';
import { StockMovementsTable } from '@/features/inventory/components/stock-movements-table';
import { StockSummaryTable } from '@/features/inventory/components/stock-summary-table';
import type { InventoryTab } from '@/features/inventory/types/inventory.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;
const OVERVIEW_STOCK_LIMIT = 100;

function toStartOfDayIso(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export default function InventoryPage() {
  const { selectedOrganizationId } = useAuth();

  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');
  const [branchId, setBranchId] = useState<string | undefined>();

  const [stockFilters, setStockFilters] = useState<StockFilterState>({
    search: '',
    lowStockOnly: false,
  });
  const [batchesFilters, setBatchesFilters] = useState<BatchesFilterState>({
    onlyAvailable: false,
  });
  const [movementsFilters, setMovementsFilters] = useState<MovementsFilterState>({
    type: 'all',
    from: '',
    to: '',
  });

  const debouncedStockSearch = useDebouncedValue(stockFilters.search, 300);

  const stockFilterKey = `${selectedOrganizationId}:${activeTab}:stock:${branchId}:${debouncedStockSearch}:${stockFilters.lowStockOnly}`;
  const batchesFilterKey = `${selectedOrganizationId}:${activeTab}:batches:${branchId}:${batchesFilters.onlyAvailable}:${batchesFilters.ingredientId ?? ''}`;
  const movementsFilterKey = `${selectedOrganizationId}:${activeTab}:movements:${branchId}:${movementsFilters.type}:${movementsFilters.ingredientId ?? ''}:${movementsFilters.from}:${movementsFilters.to}`;

  const [stockPagination, setStockPagination] = useState({ filterKey: stockFilterKey, page: 1 });
  const [batchesPagination, setBatchesPagination] = useState({
    filterKey: batchesFilterKey,
    page: 1,
  });
  const [movementsPagination, setMovementsPagination] = useState({
    filterKey: movementsFilterKey,
    page: 1,
  });

  const stockPage = stockPagination.filterKey === stockFilterKey ? stockPagination.page : 1;
  const batchesPage = batchesPagination.filterKey === batchesFilterKey ? batchesPagination.page : 1;
  const movementsPage =
    movementsPagination.filterKey === movementsFilterKey ? movementsPagination.page : 1;

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, 'inventory-filter'],
    queryFn: () => branchesApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', selectedOrganizationId, 'inventory-filter'],
    queryFn: () => ingredientsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const overviewStockQuery = useQuery({
    queryKey: ['inventory', 'overview-stock', selectedOrganizationId, branchId],
    queryFn: () =>
      inventoryApi.listStock({
        page: 1,
        limit: OVERVIEW_STOCK_LIMIT,
        branchId,
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const overviewBatchesQuery = useQuery({
    queryKey: ['inventory', 'overview-batches', selectedOrganizationId, branchId],
    queryFn: () =>
      inventoryApi.listBatches({
        page: 1,
        limit: 1,
        branchId,
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const overviewMovementsQuery = useQuery({
    queryKey: ['inventory', 'overview-movements', selectedOrganizationId, branchId],
    queryFn: () =>
      inventoryApi.listMovements({
        page: 1,
        limit: 1,
        branchId,
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const stockQueryParams = useMemo(
    () => ({
      page: stockPage,
      limit: PAGE_LIMIT,
      branchId,
      q: debouncedStockSearch || undefined,
      lowStockOnly: stockFilters.lowStockOnly || undefined,
    }),
    [stockPage, branchId, debouncedStockSearch, stockFilters.lowStockOnly],
  );

  const batchesQueryParams = useMemo(
    () => ({
      page: batchesPage,
      limit: PAGE_LIMIT,
      branchId,
      ingredientId: batchesFilters.ingredientId,
      onlyAvailable: batchesFilters.onlyAvailable || undefined,
    }),
    [batchesPage, branchId, batchesFilters.ingredientId, batchesFilters.onlyAvailable],
  );

  const movementsQueryParams = useMemo(
    () => ({
      page: movementsPage,
      limit: PAGE_LIMIT,
      branchId,
      ingredientId: movementsFilters.ingredientId,
      type: movementsFilters.type === 'all' ? undefined : movementsFilters.type,
      from: movementsFilters.from ? toStartOfDayIso(movementsFilters.from) : undefined,
      to: movementsFilters.to ? toEndOfDayIso(movementsFilters.to) : undefined,
    }),
    [
      movementsPage,
      branchId,
      movementsFilters.ingredientId,
      movementsFilters.type,
      movementsFilters.from,
      movementsFilters.to,
    ],
  );

  const stockQuery = useQuery({
    queryKey: ['inventory', 'stock', selectedOrganizationId, stockQueryParams],
    queryFn: () => inventoryApi.listStock(stockQueryParams),
    enabled: Boolean(selectedOrganizationId) && activeTab === 'stock',
  });

  const batchesQuery = useQuery({
    queryKey: ['inventory', 'batches', selectedOrganizationId, batchesQueryParams],
    queryFn: () => inventoryApi.listBatches(batchesQueryParams),
    enabled: Boolean(selectedOrganizationId) && activeTab === 'batches',
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements', selectedOrganizationId, movementsQueryParams],
    queryFn: () => inventoryApi.listMovements(movementsQueryParams),
    enabled: Boolean(selectedOrganizationId) && activeTab === 'movements',
  });

  const overviewLoading =
    overviewStockQuery.isLoading ||
    overviewBatchesQuery.isLoading ||
    overviewMovementsQuery.isLoading;

  const overviewMetrics = useMemo(() => {
    const stockItems = overviewStockQuery.data?.data ?? [];
    const totalStockValue = stockItems.reduce((sum, item) => {
      const value = Number.parseFloat(item.totalValue);
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
    const lowStockCount = stockItems.filter((item) => item.isLowStock).length;

    return {
      totalStockValue,
      lowStockCount,
      batchesCount: overviewBatchesQuery.data?.meta.total ?? 0,
      movementsCount: overviewMovementsQuery.data?.meta.total ?? 0,
    };
  }, [overviewStockQuery.data, overviewBatchesQuery.data, overviewMovementsQuery.data]);

  const handleTabChange = (tab: InventoryTab) => {
    setActiveTab(tab);
  };

  const activeError =
    activeTab === 'stock'
      ? stockQuery.error
      : activeTab === 'batches'
        ? batchesQuery.error
        : movementsQuery.error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stok</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stok seviyelerini, parti maliyetlerini ve stok hareket geçmişini takip edin.
        </p>
      </div>

      <InventoryOverviewCards
        totalStockValue={overviewMetrics.totalStockValue}
        lowStockCount={overviewMetrics.lowStockCount}
        batchesCount={overviewMetrics.batchesCount}
        movementsCount={overviewMetrics.movementsCount}
        isLoading={overviewLoading}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <InventoryTabs activeTab={activeTab} onChange={handleTabChange} />

          <InventoryFilters
            activeTab={activeTab}
            branchId={branchId}
            branches={branchesQuery.data?.data ?? []}
            ingredients={ingredientsQuery.data?.data ?? []}
            stockFilters={stockFilters}
            batchesFilters={batchesFilters}
            movementsFilters={movementsFilters}
            onBranchChange={setBranchId}
            onStockFiltersChange={setStockFilters}
            onBatchesFiltersChange={setBatchesFilters}
            onMovementsFiltersChange={setMovementsFilters}
          />

          {activeError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(activeError, 'Stok verileri yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          {activeTab === 'stock' ? (
            <>
              <StockSummaryTable
                items={stockQuery.data?.data ?? []}
                isLoading={stockQuery.isLoading}
              />
              <TablePagination
                meta={stockQuery.data?.meta}
                onPageChange={(page) => setStockPagination({ filterKey: stockFilterKey, page })}
              />
            </>
          ) : null}

          {activeTab === 'batches' ? (
            <>
              <StockBatchesTable
                items={batchesQuery.data?.data ?? []}
                isLoading={batchesQuery.isLoading}
              />
              <TablePagination
                meta={batchesQuery.data?.meta}
                onPageChange={(page) => setBatchesPagination({ filterKey: batchesFilterKey, page })}
              />
            </>
          ) : null}

          {activeTab === 'movements' ? (
            <>
              <StockMovementsTable
                items={movementsQuery.data?.data ?? []}
                isLoading={movementsQuery.isLoading}
              />
              <TablePagination
                meta={movementsQuery.data?.meta}
                onPageChange={(page) =>
                  setMovementsPagination({ filterKey: movementsFilterKey, page })
                }
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
