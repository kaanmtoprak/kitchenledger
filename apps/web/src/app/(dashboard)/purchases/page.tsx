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
import { ingredientsApi } from '@/features/ingredients/api/ingredients.api';
import { purchasesApi } from '@/features/purchases/api/purchases.api';
import { PurchaseDetailDialog } from '@/features/purchases/components/purchase-detail-dialog';
import { PurchaseFormDialog } from '@/features/purchases/components/purchase-form-dialog';
import {
  PurchasesFilters,
  type PurchasesFilterState,
} from '@/features/purchases/components/purchases-filters';
import { PurchasesTable } from '@/features/purchases/components/purchases-table';
import type { PurchaseFormValues } from '@/features/purchases/schemas/purchase.schemas';
import type { PurchaseListItem } from '@/features/purchases/types/purchase.types';
import { suppliersApi } from '@/features/suppliers/api/suppliers.api';
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

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [filters, setFilters] = useState<PurchasesFilterState>({
    search: '',
    from: '',
    to: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailPurchaseId, setDetailPurchaseId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.branchId ?? ''}:${filters.supplierId ?? ''}:${filters.from}:${filters.to}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const setPage = (nextPage: number) => {
    setPagination({ filterKey, page: nextPage });
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      includeItems: true,
      q: debouncedSearch || undefined,
      branchId: filters.branchId,
      supplierId: filters.supplierId,
      from: filters.from ? toStartOfDayIso(filters.from) : undefined,
      to: filters.to ? toEndOfDayIso(filters.to) : undefined,
    }),
    [page, debouncedSearch, filters.branchId, filters.supplierId, filters.from, filters.to],
  );

  const purchasesQuery = useQuery({
    queryKey: ['purchases', selectedOrganizationId, queryParams],
    queryFn: () => purchasesApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'purchases' });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', selectedOrganizationId, 'purchases-form'],
    queryFn: () => suppliersApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', selectedOrganizationId, 'purchases-form'],
    queryFn: () => ingredientsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const branchNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const branch of branches) {
      map[branch.id] = branch.name;
    }
    return map;
  }, [branches]);

  const supplierNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const supplier of suppliersQuery.data?.data ?? []) {
      map[supplier.id] = supplier.name;
    }
    return map;
  }, [suppliersQuery.data]);

  const handleCreateSubmit = async (values: PurchaseFormValues) => {
    setSuccessMessage(null);
    await createMutation.mutateAsync({
      branchId: values.branchId,
      supplierId: optionalField(values.supplierId),
      purchasedAt: values.purchasedAt ? new Date(values.purchasedAt).toISOString() : undefined,
      invoiceNumber: optionalField(values.invoiceNumber),
      notes: optionalField(values.notes),
      items: values.items.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity.trim(),
        unit: item.unit,
        totalPrice: item.totalPrice.trim(),
      })),
    });
    setSuccessMessage('Satın alma kaydedildi. Stok partileri güncellendi.');
  };

  const handleViewPurchase = (purchase: PurchaseListItem) => {
    setDetailPurchaseId(purchase.id);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satın Almalar"
        description="Malzeme girişlerini kaydedin; stok partileri ve maliyetler otomatik oluşsun."
        action={
          permissions.canCreatePurchase ? (
            <Button type="button" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Satın Alma Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <PurchasesFilters
            filters={filters}
            branches={branches}
            isBranchesLoading={branchesQuery.isLoading}
            suppliers={suppliersQuery.data?.data ?? []}
            onChange={setFilters}
          />

          {purchasesQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(purchasesQuery.error, 'Satın almalar yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <PurchasesTable
            purchases={purchasesQuery.data?.data ?? []}
            branchNameById={branchNameById}
            supplierNameById={supplierNameById}
            isLoading={purchasesQuery.isLoading}
            canCreate={permissions.canCreatePurchase}
            onView={handleViewPurchase}
            onCreate={permissions.canCreatePurchase ? () => setCreateDialogOpen(true) : undefined}
          />

          <TablePagination meta={purchasesQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canCreatePurchase ? (
        <PurchaseFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          branches={branches}
          suppliers={suppliersQuery.data?.data ?? []}
          ingredients={ingredientsQuery.data?.data ?? []}
          onSubmit={handleCreateSubmit}
        />
      ) : null}

      <PurchaseDetailDialog
        purchaseId={detailPurchaseId}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailPurchaseId(null);
          }
        }}
      />
    </div>
  );
}
