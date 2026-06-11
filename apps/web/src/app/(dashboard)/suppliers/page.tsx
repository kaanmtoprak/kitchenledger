'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { TablePagination } from '@/components/common/table-pagination';
import { suppliersApi } from '@/features/suppliers/api/suppliers.api';
import { SupplierFormDialog } from '@/features/suppliers/components/supplier-form-dialog';
import {
  SuppliersFilters,
  type SuppliersFilterState,
} from '@/features/suppliers/components/suppliers-filters';
import { SuppliersTable } from '@/features/suppliers/components/suppliers-table';
import type { SupplierFormValues } from '@/features/suppliers/schemas/supplier.schemas';
import type { Supplier } from '@/features/suppliers/types/supplier.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

function optionalField(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const invalidateSuppliers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['suppliers', selectedOrganizationId] }),
      queryClient.invalidateQueries({ queryKey: ['purchases'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const [filters, setFilters] = useState<SuppliersFilterState>({
    search: '',
    includeInactive: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deactivatingSupplier, setDeactivatingSupplier] = useState<Supplier | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.includeInactive}`;
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
      includeInactive: filters.includeInactive || undefined,
    }),
    [page, debouncedSearch, filters.includeInactive],
  );

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', selectedOrganizationId, queryParams],
    queryFn: () => suppliersApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: invalidateSuppliers,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof suppliersApi.update>[1];
    }) => suppliersApi.update(id, payload),
    onSuccess: invalidateSuppliers,
  });

  const deactivateMutation = useMutation({
    mutationFn: suppliersApi.deactivate,
    onSuccess: async () => {
      await invalidateSuppliers();
      setDeactivatingSupplier(null);
      setDeactivateError(null);
    },
  });

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const buildPayload = (values: SupplierFormValues) => ({
    name: values.name.trim(),
    contactName: optionalField(values.contactName),
    phone: optionalField(values.phone),
    email: optionalField(values.email),
    notes: optionalField(values.notes),
    ...(editingSupplier ? { isActive: values.isActive ?? true } : {}),
  });

  const handleSubmit = async (values: SupplierFormValues) => {
    const payload = buildPayload(values);

    if (editingSupplier) {
      await updateMutation.mutateAsync({ id: editingSupplier.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tedarikçiler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tedarikçi iletişimlerini ve satın alma kaynaklarını yönetin.
          </p>
        </div>
        {permissions.canMutateReferenceData ? (
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Tedarikçi Oluştur
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <SuppliersFilters filters={filters} onChange={setFilters} />

          {suppliersQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(suppliersQuery.error, 'Tedarikçiler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <SuppliersTable
            suppliers={suppliersQuery.data?.data ?? []}
            isLoading={suppliersQuery.isLoading}
            canEdit={permissions.canMutateReferenceData}
            canDeactivate={permissions.canDeactivateRecords}
            onEdit={openEditDialog}
            onDeactivate={setDeactivatingSupplier}
            onCreate={permissions.canMutateReferenceData ? openCreateDialog : undefined}
          />

          <TablePagination meta={suppliersQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canMutateReferenceData ? (
        <SupplierFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          supplier={editingSupplier}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deactivateError ? (
        <Alert variant="destructive">
          <AlertDescription>{deactivateError}</AlertDescription>
        </Alert>
      ) : null}

      {permissions.canDeactivateRecords ? (
        <ConfirmDialog
          open={Boolean(deactivatingSupplier)}
          onOpenChange={(open) => {
            if (!open) {
              setDeactivatingSupplier(null);
              setDeactivateError(null);
            }
          }}
          title="Tedarikçiyi pasife al?"
          description={
            deactivatingSupplier
              ? `"${deactivatingSupplier.name}" pasif olarak işaretlenecek ve varsayılan listelerde gizlenecek.`
              : ''
          }
          confirmLabel="Pasife Al"
          isLoading={deactivateMutation.isPending}
          onConfirm={() => {
            if (!deactivatingSupplier) {
              return;
            }
            deactivateMutation.mutate(deactivatingSupplier.id, {
              onError: (error) => {
                setDeactivateError(getApiErrorMessage(error, 'Tedarikçi pasife alınamadı.'));
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
