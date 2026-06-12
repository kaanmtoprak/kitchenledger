'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BranchFormSelect } from '@/components/common/branch-form-select';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatBaseUnit, formatCurrency, formatQuantityDisplay } from '@/lib/utils/display';
import {
  defaultStockAdjustmentValues,
  stockAdjustmentSchema,
  type StockAdjustmentFormValues,
} from '../schemas/stock-adjustment.schemas';
import type { CreateStockAdjustmentPayload } from '../types/inventory.types';

const FIFO_VALUE = '__fifo__';

type StockAdjustmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  ingredients: Ingredient[];
  onSubmit: (payload: CreateStockAdjustmentPayload) => Promise<void>;
};

function formatAdjustmentType(type: StockAdjustmentFormValues['type']): string {
  switch (type) {
    case 'WASTE':
      return 'Fire / Zayi';
    case 'RETURN':
      return 'İade';
    case 'MANUAL_ADJUSTMENT':
      return 'Manuel Düzeltme';
    default:
      return type;
  }
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  branches,
  ingredients,
  onSubmit,
}: StockAdjustmentDialogProps) {
  const { selectedOrganizationId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: defaultStockAdjustmentValues,
  });

  const watchedBranchId = useWatch({ control: form.control, name: 'branchId' }) ?? '';
  const watchedIngredientId = useWatch({ control: form.control, name: 'ingredientId' }) ?? '';
  const watchedType = useWatch({ control: form.control, name: 'type' });
  const watchedDirection = useWatch({ control: form.control, name: 'adjustmentDirection' });

  const selectedIngredient = ingredients.find(
    (ingredient) => ingredient.id === watchedIngredientId,
  );

  const isDecrease =
    watchedType === 'WASTE' ||
    (watchedType === 'MANUAL_ADJUSTMENT' && watchedDirection === 'DECREASE');

  const needsUnitCost =
    watchedType === 'RETURN' ||
    (watchedType === 'MANUAL_ADJUSTMENT' && watchedDirection === 'INCREASE');

  const batchesQuery = useQuery({
    queryKey: [
      'inventory',
      'batches',
      selectedOrganizationId,
      'adjustment',
      watchedBranchId,
      watchedIngredientId,
    ],
    queryFn: () =>
      inventoryApi.listBatches({
        branchId: watchedBranchId,
        ingredientId: watchedIngredientId,
        onlyAvailable: true,
        page: 1,
        limit: 100,
      }),
    enabled: Boolean(
      open && selectedOrganizationId && watchedBranchId && watchedIngredientId && isDecrease,
    ),
  });

  const stockSummaryQuery = useQuery({
    queryKey: [
      'inventory',
      'stock',
      selectedOrganizationId,
      'adjustment-cost',
      watchedBranchId,
      watchedIngredientId,
    ],
    queryFn: () =>
      inventoryApi.listStock({
        branchId: watchedBranchId,
        ingredientId: watchedIngredientId,
        page: 1,
        limit: 1,
      }),
    enabled: Boolean(
      open && selectedOrganizationId && watchedBranchId && watchedIngredientId && needsUnitCost,
    ),
  });

  const weightedAverageUnitCost = stockSummaryQuery.data?.data[0]?.weightedAverageUnitCost;
  const hasWeightedAverage =
    weightedAverageUnitCost !== undefined &&
    weightedAverageUnitCost !== null &&
    weightedAverageUnitCost !== '0' &&
    Number.parseFloat(weightedAverageUnitCost) > 0;

  const batchOptions = useMemo(() => batchesQuery.data?.data ?? [], [batchesQuery.data]);

  useEffect(() => {
    if (!isDecrease) {
      form.setValue('stockBatchId', FIFO_VALUE);
    }
  }, [isDecrease, form]);

  useEffect(() => {
    if (watchedType === 'MANUAL_ADJUSTMENT' && !watchedDirection) {
      form.setValue('adjustmentDirection', 'DECREASE');
    }
    if (watchedType !== 'MANUAL_ADJUSTMENT') {
      form.setValue('adjustmentDirection', undefined);
    }
  }, [watchedType, watchedDirection, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultStockAdjustmentValues);
    } else {
      setError(null);
      form.reset(defaultStockAdjustmentValues);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: StockAdjustmentFormValues) => {
    setError(null);

    const payload: CreateStockAdjustmentPayload = {
      branchId: values.branchId,
      ingredientId: values.ingredientId,
      type: values.type,
      quantity: values.quantity.trim(),
      reason: values.reason.trim(),
      ...(values.type === 'MANUAL_ADJUSTMENT' && values.adjustmentDirection
        ? { adjustmentDirection: values.adjustmentDirection }
        : {}),
      ...(values.unitCost?.trim() ? { unitCost: values.unitCost.trim() } : {}),
      ...(isDecrease && values.stockBatchId && values.stockBatchId !== FIFO_VALUE
        ? { stockBatchId: values.stockBatchId }
        : {}),
    };

    try {
      await onSubmit(payload);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Stok düzeltmesi kaydedilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Stok Düzeltme</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şube</FormLabel>
                  <FormControl>
                    <BranchFormSelect
                      value={field.value}
                      branches={branches}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ingredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malzeme</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Malzeme seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşlem tipi</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İşlem tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WASTE">{formatAdjustmentType('WASTE')}</SelectItem>
                      <SelectItem value="RETURN">{formatAdjustmentType('RETURN')}</SelectItem>
                      <SelectItem value="MANUAL_ADJUSTMENT">
                        {formatAdjustmentType('MANUAL_ADJUSTMENT')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === 'MANUAL_ADJUSTMENT' ? (
              <FormField
                control={form.control}
                name="adjustmentDirection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yön</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Yön seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCREASE">Stok Artır</SelectItem>
                        <SelectItem value="DECREASE">Stok Azalt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Miktar</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" step="any" placeholder="0" />
                  </FormControl>
                  {selectedIngredient ? (
                    <FormDescription>
                      Birim: {formatBaseUnit(selectedIngredient.baseUnit)}
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsUnitCost ? (
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim maliyet</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="any" placeholder="0,00" />
                    </FormControl>
                    <FormDescription>
                      {hasWeightedAverage
                        ? `Boş bırakırsanız ağırlıklı ortalama kullanılır (${formatCurrency(weightedAverageUnitCost)}).`
                        : 'Mevcut stok yoksa birim maliyet girilmelidir.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {isDecrease ? (
              <FormField
                control={form.control}
                name="stockBatchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok partisi</FormLabel>
                    <Select value={field.value ?? FIFO_VALUE} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Otomatik (FIFO)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={FIFO_VALUE}>Otomatik (FIFO)</SelectItem>
                        {batchOptions.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            Parti {batch.id.slice(-6)} — Kalan:{' '}
                            {formatQuantityDisplay(batch.remainingQuantity)}{' '}
                            {formatBaseUnit(batch.unit as Ingredient['baseUnit'])} — Birim maliyet:{' '}
                            {formatCurrency(batch.unitCost)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Parti seçilmezse en eski stok partilerinden (FIFO) düşülür.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Sayım farkı, fire, iade veya düzeltme nedenini yazın."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
