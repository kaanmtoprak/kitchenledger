'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { SuccessAlert } from '@/components/common/success-alert';
import { TablePagination } from '@/components/common/table-pagination';
import { ingredientsApi } from '@/features/ingredients/api/ingredients.api';
import { IngredientFormDialog } from '@/features/ingredients/components/ingredient-form-dialog';
import {
  IngredientsFilters,
  type IngredientsFilterState,
} from '@/features/ingredients/components/ingredients-filters';
import { IngredientsTable } from '@/features/ingredients/components/ingredients-table';
import type { IngredientFormValues } from '@/features/ingredients/schemas/ingredient.schemas';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

export default function IngredientsPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const invalidateIngredients = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ingredients', selectedOrganizationId] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
    ]);
  };

  const [filters, setFilters] = useState<IngredientsFilterState>({
    search: '',
    includeInactive: false,
    baseUnit: 'all',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deactivatingIngredient, setDeactivatingIngredient] = useState<Ingredient | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.includeInactive}:${filters.baseUnit}`;
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
      baseUnit: filters.baseUnit === 'all' ? undefined : filters.baseUnit,
    }),
    [page, debouncedSearch, filters.includeInactive, filters.baseUnit],
  );

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', selectedOrganizationId, queryParams],
    queryFn: () => ingredientsApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: ingredientsApi.create,
    onSuccess: invalidateIngredients,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof ingredientsApi.update>[1];
    }) => ingredientsApi.update(id, payload),
    onSuccess: invalidateIngredients,
  });

  const deactivateMutation = useMutation({
    mutationFn: ingredientsApi.deactivate,
    onSuccess: async () => {
      await invalidateIngredients();
      setDeactivatingIngredient(null);
      setDeactivateError(null);
    },
  });

  const openCreateDialog = () => {
    setEditingIngredient(null);
    setDialogOpen(true);
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setDialogOpen(true);
  };

  const buildPayload = (values: IngredientFormValues) => {
    const minimumStockLevel =
      values.minimumStockLevel && values.minimumStockLevel.trim() !== ''
        ? values.minimumStockLevel.trim()
        : null;

    return {
      name: values.name.trim(),
      sku: values.sku.trim(),
      baseUnit: values.baseUnit,
      minimumStockLevel,
      ...(editingIngredient ? { isActive: values.isActive ?? true } : {}),
    };
  };

  const handleSubmit = async (values: IngredientFormValues) => {
    setSuccessMessage(null);
    const payload = buildPayload(values);

    if (editingIngredient) {
      await updateMutation.mutateAsync({ id: editingIngredient.id, payload });
      setSuccessMessage('Malzeme güncellendi.');
      return;
    }

    await createMutation.mutateAsync(payload);
    setSuccessMessage('Malzeme oluşturuldu.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Malzemeler"
        description="Reçete maliyeti ve stok takibi için kullanılan ham maddeleri yönetin."
        action={
          permissions.canMutateReferenceData ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Malzeme Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <IngredientsFilters filters={filters} onChange={setFilters} />

          {ingredientsQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(ingredientsQuery.error, 'Malzemeler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <IngredientsTable
            ingredients={ingredientsQuery.data?.data ?? []}
            isLoading={ingredientsQuery.isLoading}
            canEdit={permissions.canMutateReferenceData}
            canDeactivate={permissions.canDeactivateRecords}
            onEdit={openEditDialog}
            onDeactivate={setDeactivatingIngredient}
            onCreate={permissions.canMutateReferenceData ? openCreateDialog : undefined}
          />

          <TablePagination meta={ingredientsQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canMutateReferenceData ? (
        <IngredientFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          ingredient={editingIngredient}
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
          open={Boolean(deactivatingIngredient)}
          onOpenChange={(open) => {
            if (!open) {
              setDeactivatingIngredient(null);
              setDeactivateError(null);
            }
          }}
          title="Malzemeyi pasife al?"
          description={
            deactivatingIngredient
              ? `"${deactivatingIngredient.name}" pasif olarak işaretlenecek ve varsayılan listelerde gizlenecek.`
              : ''
          }
          confirmLabel="Pasife Al"
          isLoading={deactivateMutation.isPending}
          onConfirm={() => {
            if (!deactivatingIngredient) {
              return;
            }
            deactivateMutation.mutate(deactivatingIngredient.id, {
              onSuccess: () => setSuccessMessage('Malzeme pasife alındı.'),
              onError: (error) => {
                setDeactivateError(getApiErrorMessage(error, 'Malzeme pasife alınamadı.'));
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
