'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import { formatBaseUnit, formatCurrency } from '@/lib/utils/display';
import { defaultPurchaseItem, type PurchaseFormValues } from '../schemas/purchase.schemas';
import { calculateUnitCost } from '../types/purchase.types';

type PurchaseItemsFieldArrayProps = {
  form: UseFormReturn<PurchaseFormValues>;
  ingredients: Ingredient[];
};

export function PurchaseItemsFieldArray({ form, ingredients }: PurchaseItemsFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  const getIngredientLabel = (ingredient: Ingredient) =>
    `${ingredient.name} (${ingredient.sku}) — ${formatBaseUnit(ingredient.baseUnit)}`;

  const getSelectedIngredientIds = (currentIndex: number) =>
    watchedItems
      .map((item, index) => (index === currentIndex ? null : item.ingredientId))
      .filter((id): id is string => Boolean(id));

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const ingredient = ingredients.find((item) => item.id === ingredientId);
    form.setValue(`items.${index}.ingredientId`, ingredientId, { shouldValidate: true });
    if (ingredient) {
      form.setValue(`items.${index}.unit`, ingredient.baseUnit, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Kalemler</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...defaultPurchaseItem })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Kalem ekle
        </Button>
      </div>

      {fields.map((field, index) => {
        const unitCost = calculateUnitCost(
          watchedItems[index]?.quantity ?? '',
          watchedItems[index]?.totalPrice ?? '',
        );
        const excludedIds = getSelectedIngredientIds(index);

        return (
          <div key={field.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Kalem {index + 1}</p>
              {fields.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Kaldır
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`items.${index}.ingredientId`}
                render={({ field: ingredientField }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Malzeme</FormLabel>
                    <Select
                      value={ingredientField.value}
                      onValueChange={(value) => handleIngredientChange(index, value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Malzeme seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ingredients
                          .filter(
                            (ingredient) =>
                              ingredient.id === ingredientField.value ||
                              !excludedIds.includes(ingredient.id),
                          )
                          .map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {getIngredientLabel(ingredient)}
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
                name={`items.${index}.quantity`}
                render={({ field: quantityField }) => (
                  <FormItem>
                    <FormLabel>Miktar</FormLabel>
                    <FormControl>
                      <Input {...quantityField} inputMode="decimal" placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.unit`}
                render={({ field: unitField }) => (
                  <FormItem>
                    <FormLabel>Birim</FormLabel>
                    <Select value={unitField.value} onValueChange={unitField.onChange} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Birim" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={unitField.value}>
                          {formatBaseUnit(unitField.value)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.totalPrice`}
                render={({ field: priceField }) => (
                  <FormItem>
                    <FormLabel>Toplam Fiyat</FormLabel>
                    <FormControl>
                      <Input {...priceField} inputMode="decimal" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Birim maliyet:{' '}
                  {unitCost !== null
                    ? `${formatCurrency(unitCost)} / ${formatBaseUnit(watchedItems[index]?.unit ?? 'GRAM')}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {form.formState.errors.items?.message ? (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.items.message}
        </p>
      ) : null}
    </div>
  );
}
