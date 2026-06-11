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
import { productsApi } from '@/features/products/api/products.api';
import { ProductCostDialog } from '@/features/products/components/product-cost-dialog';
import { ProductFormDialog } from '@/features/products/components/product-form-dialog';
import {
  ProductsFilters,
  type ProductsFilterState,
} from '@/features/products/components/products-filters';
import { ProductsTable } from '@/features/products/components/products-table';
import type { ProductFormValues } from '@/features/products/schemas/product.schemas';
import type { Product } from '@/features/products/types/product.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

function optionalField(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseDefaultServingCount(value?: string): number | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [filters, setFilters] = useState<ProductsFilterState>({
    search: '',
    includeInactive: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [costProduct, setCostProduct] = useState<Product | null>(null);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);
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

  const productsQuery = useQuery({
    queryKey: ['products', selectedOrganizationId, queryParams],
    queryFn: () => productsApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const invalidateRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: invalidateRelated,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof productsApi.update>[1];
    }) => productsApi.update(id, payload),
    onSuccess: invalidateRelated,
  });

  const deactivateMutation = useMutation({
    mutationFn: productsApi.deactivate,
    onSuccess: async () => {
      await invalidateRelated();
      setDeactivatingProduct(null);
      setDeactivateError(null);
    },
  });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const openCostDialog = (product: Product) => {
    setCostProduct(product);
    setCostDialogOpen(true);
  };

  const buildPayload = (values: ProductFormValues) => {
    const defaultServingCount = parseDefaultServingCount(values.defaultServingCount);

    return {
      name: values.name.trim(),
      sku: values.sku.trim(),
      description: optionalField(values.description),
      ...(defaultServingCount !== undefined ? { defaultServingCount } : {}),
      ...(editingProduct ? { isActive: values.isActive ?? true } : {}),
    };
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setSuccessMessage(null);
    const payload = buildPayload(values);

    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, payload });
      setSuccessMessage('Ürün güncellendi.');
      return;
    }

    await createMutation.mutateAsync(payload);
    setSuccessMessage('Ürün oluşturuldu.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürünler"
        description="Satılabilir ürünlerinizi tanımlayın ve reçetelerle maliyetlerini takip edin."
        action={
          permissions.canManageProductsAndRecipes ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Ürün Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <ProductsFilters filters={filters} onChange={setFilters} />

          {productsQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(productsQuery.error, 'Ürünler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <ProductsTable
            products={productsQuery.data?.data ?? []}
            isLoading={productsQuery.isLoading}
            canEdit={permissions.canManageProductsAndRecipes}
            canDeactivate={permissions.canDeactivateRecords}
            onEdit={openEditDialog}
            onDeactivate={setDeactivatingProduct}
            onViewCost={openCostDialog}
            onCreate={permissions.canManageProductsAndRecipes ? openCreateDialog : undefined}
          />

          <TablePagination meta={productsQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canManageProductsAndRecipes ? (
        <ProductFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={editingProduct}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ProductCostDialog
        product={costProduct}
        open={costDialogOpen}
        onOpenChange={(open) => {
          setCostDialogOpen(open);
          if (!open) {
            setCostProduct(null);
          }
        }}
      />

      {deactivateError ? (
        <Alert variant="destructive">
          <AlertDescription>{deactivateError}</AlertDescription>
        </Alert>
      ) : null}

      {permissions.canDeactivateRecords ? (
        <ConfirmDialog
          open={Boolean(deactivatingProduct)}
          onOpenChange={(open) => {
            if (!open) {
              setDeactivatingProduct(null);
              setDeactivateError(null);
            }
          }}
          title="Ürünü pasife al?"
          description={
            deactivatingProduct
              ? `"${deactivatingProduct.name}" pasif olarak işaretlenecek ve varsayılan listelerde gizlenecek.`
              : ''
          }
          confirmLabel="Pasife Al"
          isLoading={deactivateMutation.isPending}
          onConfirm={() => {
            if (!deactivatingProduct) {
              return;
            }
            deactivateMutation.mutate(deactivatingProduct.id, {
              onSuccess: () => setSuccessMessage('Ürün pasife alındı.'),
              onError: (error) => {
                setDeactivateError(getApiErrorMessage(error, 'Ürün pasife alınamadı.'));
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
