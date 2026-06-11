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
import { productsApi } from '@/features/products/api/products.api';
import { recipesApi } from '@/features/recipes/api/recipes.api';
import { RecipeCostDialog } from '@/features/recipes/components/recipe-cost-dialog';
import { RecipeDetailDialog } from '@/features/recipes/components/recipe-detail-dialog';
import { RecipeFormDialog } from '@/features/recipes/components/recipe-form-dialog';
import {
  RecipesFilters,
  type RecipesFilterState,
} from '@/features/recipes/components/recipes-filters';
import { RecipesTable } from '@/features/recipes/components/recipes-table';
import type { RecipeFormValues } from '@/features/recipes/schemas/recipe.schemas';
import type { RecipeListItem } from '@/features/recipes/types/recipe.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipesFilterState>({
    search: '',
  });
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [detailRecipeId, setDetailRecipeId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [costRecipe, setCostRecipe] = useState<RecipeListItem | null>(null);
  const [costDialogOpen, setCostDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.productId ?? ''}`;
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
      productId: filters.productId,
    }),
    [page, debouncedSearch, filters.productId],
  );

  const recipesQuery = useQuery({
    queryKey: ['recipes', selectedOrganizationId, queryParams],
    queryFn: () => recipesApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const productsQuery = useQuery({
    queryKey: ['products', selectedOrganizationId, 'recipes-form'],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', selectedOrganizationId, 'recipes-form'],
    queryFn: () => ingredientsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const invalidateRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: recipesApi.create,
    onSuccess: invalidateRelated,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof recipesApi.update>[1];
    }) => recipesApi.update(id, payload),
    onSuccess: invalidateRelated,
  });

  const openCreateDialog = () => {
    setEditingRecipeId(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (recipe: RecipeListItem) => {
    setEditingRecipeId(recipe.id);
    setFormDialogOpen(true);
  };

  const handleViewRecipe = (recipe: RecipeListItem) => {
    setDetailRecipeId(recipe.id);
    setDetailDialogOpen(true);
  };

  const openCostDialog = (recipe: RecipeListItem) => {
    setCostRecipe(recipe);
    setCostDialogOpen(true);
  };

  const buildItemsPayload = (values: RecipeFormValues) =>
    values.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity.trim(),
      unit: item.unit,
    }));

  const handleSubmit = async (values: RecipeFormValues, isEdit: boolean) => {
    setSuccessMessage(null);
    if (isEdit && editingRecipeId) {
      await updateMutation.mutateAsync({
        id: editingRecipeId,
        payload: {
          name: values.name.trim(),
          yieldQuantity: values.yieldQuantity.trim(),
          yieldUnit: values.yieldUnit,
          items: buildItemsPayload(values),
        },
      });
      setSuccessMessage('Reçete güncellendi.');
      return;
    }

    await createMutation.mutateAsync({
      productId: values.productId,
      name: values.name.trim(),
      yieldQuantity: values.yieldQuantity.trim(),
      yieldUnit: values.yieldUnit,
      items: buildItemsPayload(values),
    });
    setSuccessMessage('Reçete oluşturuldu.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reçeteler"
        description="Ürün reçetelerini oluşturun, malzeme kullanımını ve maliyetleri hesaplayın."
        action={
          permissions.canManageProductsAndRecipes ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Reçete Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <RecipesFilters
            filters={filters}
            products={productsQuery.data?.data ?? []}
            onChange={setFilters}
          />

          {recipesQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(recipesQuery.error, 'Reçeteler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <RecipesTable
            recipes={recipesQuery.data?.data ?? []}
            isLoading={recipesQuery.isLoading}
            canEdit={permissions.canManageProductsAndRecipes}
            onView={handleViewRecipe}
            onEdit={openEditDialog}
            onViewCost={openCostDialog}
            onCreate={permissions.canManageProductsAndRecipes ? openCreateDialog : undefined}
          />

          <TablePagination meta={recipesQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canManageProductsAndRecipes ? (
        <RecipeFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          recipeId={editingRecipeId}
          products={productsQuery.data?.data ?? []}
          ingredients={ingredientsQuery.data?.data ?? []}
          onSubmit={handleSubmit}
        />
      ) : null}

      <RecipeDetailDialog
        recipeId={detailRecipeId}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailRecipeId(null);
          }
        }}
      />

      <RecipeCostDialog
        recipe={costRecipe}
        open={costDialogOpen}
        onOpenChange={(open) => {
          setCostDialogOpen(open);
          if (!open) {
            setCostRecipe(null);
          }
        }}
      />
    </div>
  );
}
