'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { SuccessAlert } from '@/components/common/success-alert';
import { TablePagination } from '@/components/common/table-pagination';
import { productsApi } from '@/features/products/api/products.api';
import { productionsApi } from '@/features/productions/api/productions.api';
import { ProductionCancelDialog } from '@/features/productions/components/production-cancel-dialog';
import { ProductionDetailDialog } from '@/features/productions/components/production-detail-dialog';
import { ProductionFormDialog } from '@/features/productions/components/production-form-dialog';
import {
  ProductionsFilters,
  type ProductionsFilterState,
} from '@/features/productions/components/productions-filters';
import { ProductionsTable } from '@/features/productions/components/productions-table';
import type { ProductionFormValues } from '@/features/productions/schemas/production.schemas';
import type { ProductionListItem } from '@/features/productions/types/production.types';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

function toStartOfDayIso(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function optionalField(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default function ProductionsPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [filters, setFilters] = useState<ProductionsFilterState>({
    search: '',
    from: '',
    to: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailProductionId, setDetailProductionId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelProduction, setCancelProduction] = useState<ProductionListItem | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.branchId ?? ''}:${filters.productId ?? ''}:${filters.from}:${filters.to}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const setPage = (nextPage: number) => {
    setPagination({ filterKey, page: nextPage });
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      q: debouncedSearch || undefined,
      branchId: filters.branchId,
      productId: filters.productId,
      from: filters.from ? toStartOfDayIso(filters.from) : undefined,
      to: filters.to ? toEndOfDayIso(filters.to) : undefined,
    }),
    [page, debouncedSearch, filters.branchId, filters.productId, filters.from, filters.to],
  );

  const productionsQuery = useQuery({
    queryKey: ['productions', selectedOrganizationId, queryParams],
    queryFn: () => productionsApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'productions' });

  const productsQuery = useQuery({
    queryKey: ['products', selectedOrganizationId, 'productions-form'],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const invalidateRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['productions'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reports', 'productions'] }),
      queryClient.invalidateQueries({ queryKey: ['reports', 'movements'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: productionsApi.create,
    onSuccess: invalidateRelated,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      productionsApi.cancel(id, { reason }),
    onSuccess: invalidateRelated,
  });

  const handleCreateSubmit = async (values: ProductionFormValues) => {
    setSuccessMessage(null);
    await createMutation.mutateAsync({
      branchId: values.branchId,
      productId: values.productId,
      quantityProduced: values.quantityProduced.trim(),
      producedAt: values.producedAt ? new Date(values.producedAt).toISOString() : undefined,
      notes: optionalField(values.notes),
    });
    setSuccessMessage('Üretim kaydedildi. FIFO stok tüketimi işlendi.');
  };

  const handleViewProduction = (production: ProductionListItem) => {
    setDetailProductionId(production.id);
    setDetailDialogOpen(true);
  };

  const handleCancelProduction = (production: ProductionListItem) => {
    setCancelProduction(production);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelProduction) {
      return;
    }
    setSuccessMessage(null);
    await cancelMutation.mutateAsync({ id: cancelProduction.id, reason });
    setSuccessMessage('Üretim iptal edildi. Tüketilen stoklar geri eklendi.');
    setCancelProduction(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Üretimler"
        description="Üretim kayıtları oluşturun; FIFO stok tüketimi ve gerçek maliyetleri izleyin."
        action={
          permissions.canCreateProduction ? (
            <Button type="button" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Üretim Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <ProductionsFilters
            filters={filters}
            branches={branches}
            isBranchesLoading={branchesQuery.isLoading}
            products={productsQuery.data?.data ?? []}
            onChange={setFilters}
          />

          {productionsQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(productionsQuery.error, 'Üretimler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <ProductionsTable
            productions={productionsQuery.data?.data ?? []}
            isLoading={productionsQuery.isLoading}
            canCreate={permissions.canCreateProduction}
            canCancel={permissions.canCancelProduction}
            onView={handleViewProduction}
            onCancel={handleCancelProduction}
            onCreate={permissions.canCreateProduction ? () => setCreateDialogOpen(true) : undefined}
          />

          <TablePagination meta={productionsQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canCreateProduction ? (
        <ProductionFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          branches={branches}
          products={productsQuery.data?.data ?? []}
          onSubmit={handleCreateSubmit}
        />
      ) : null}

      <ProductionDetailDialog
        productionId={detailProductionId}
        open={detailDialogOpen}
        canCancel={permissions.canCancelProduction}
        onCancelled={() => {
          setSuccessMessage('Üretim iptal edildi. Tüketilen stoklar geri eklendi.');
          void invalidateRelated();
        }}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailProductionId(null);
          }
        }}
      />

      <ProductionCancelDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) {
            setCancelProduction(null);
          }
        }}
        productLabel={cancelProduction?.productName}
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
