'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import type { Product } from '@/features/products/types/product.types';
import { useAuth } from '@/lib/auth/use-auth';
import { formatBaseUnit } from '@/lib/utils/display';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { recipesApi } from '../api/recipes.api';
import { RecipeItemsFieldArray } from './recipe-items-field-array';
import { BASE_UNIT_OPTIONS } from '@/features/ingredients/schemas/ingredient.schemas';
import {
  defaultRecipeFormValues,
  recipeFormSchema,
  type RecipeFormValues,
} from '../schemas/recipe.schemas';
import type { RecipeDetail } from '../types/recipe.types';

type RecipeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId?: string | null;
  products: Product[];
  ingredients: Ingredient[];
  onSubmit: (values: RecipeFormValues, isEdit: boolean) => Promise<void>;
};

function getFormValuesFromRecipe(recipe: RecipeDetail): RecipeFormValues {
  return {
    productId: recipe.productId,
    name: recipe.name,
    yieldQuantity: recipe.yieldQuantity ?? '1',
    yieldUnit: recipe.yieldUnit,
    items: recipe.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity ?? '',
      unit: item.unit,
    })),
  };
}

export function RecipeFormDialog({
  open,
  onOpenChange,
  recipeId,
  products,
  ingredients,
  onSubmit,
}: RecipeFormDialogProps) {
  const isEdit = Boolean(recipeId);
  const { selectedOrganizationId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const recipeQuery = useQuery({
    queryKey: ['recipes', 'form', selectedOrganizationId, recipeId],
    queryFn: () => recipesApi.getById(recipeId!),
    enabled: Boolean(open && isEdit && recipeId && selectedOrganizationId),
  });

  const formValues = useMemo(() => {
    if (isEdit && recipeQuery.data) {
      return getFormValuesFromRecipe(recipeQuery.data);
    }
    return defaultRecipeFormValues;
  }, [isEdit, recipeQuery.data]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    values: open && (!isEdit || recipeQuery.data) ? formValues : defaultRecipeFormValues,
  });

  const watchedProductId = form.watch('productId');
  const watchedItems = form.watch('items');
  const selectedProduct = products.find((product) => product.id === watchedProductId);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: RecipeFormValues) => {
    setError(null);
    try {
      await onSubmit(values, isEdit);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Reçete kaydedilemedi.'));
    }
  };

  const isLoadingEdit = isEdit && recipeQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Reçete Düzenle' : 'Reçete Oluştur'}</DialogTitle>
        </DialogHeader>

        {isLoadingEdit ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {isEdit && recipeQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {getApiErrorMessage(recipeQuery.error, 'Reçete yüklenemedi.')}
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoadingEdit && !(isEdit && recipeQuery.isError) ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {isEdit && recipeQuery.data ? (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Ürün</p>
                  <p className="font-medium">
                    {recipeQuery.data.product.name} ({recipeQuery.data.product.sku})
                  </p>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ürün seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reçete Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="yieldQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verim Miktarı</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yieldUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verim Birimi</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Birim seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BASE_UNIT_OPTIONS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {formatBaseUnit(unit)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <RecipeItemsFieldArray form={form} ingredients={ingredients} />

              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Kalemler:</span> {watchedItems.length}
                </p>
                <p>
                  <span className="text-muted-foreground">Verim:</span>{' '}
                  {form.watch('yieldQuantity') || '—'} {formatBaseUnit(form.watch('yieldUnit'))}
                </p>
                {selectedProduct ? (
                  <p>
                    <span className="text-muted-foreground">Ürün:</span> {selectedProduct.name}
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Vazgeç
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? 'Kaydediliyor...'
                    : isEdit
                      ? 'Değişiklikleri Kaydet'
                      : 'Oluştur'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
