'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form';
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
import type { Product } from '@/features/products/types/product.types';
import { formatCurrency } from '@/lib/utils/display';
import {
  defaultOrderFormValues,
  defaultOrderItem,
  type OrderFormValues,
} from '../schemas/order.schemas';

type OrderItemsFieldArrayProps = {
  form: UseFormReturn<OrderFormValues>;
  products: Product[];
};

function calculateLineTotal(quantity: string, unitPrice: string): number | null {
  const qty = Number.parseFloat(quantity);
  const price = Number.parseFloat(unitPrice);
  if (Number.isNaN(qty) || Number.isNaN(price)) {
    return null;
  }
  return qty * price;
}

export function OrderItemsFieldArray({ form, products }: OrderItemsFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' }) ?? defaultOrderFormValues.items;

  const getSelectedProductIds = (currentIndex: number) =>
    watchedItems
      .map((item, index) => (index === currentIndex ? null : item.productId))
      .filter((id): id is string => Boolean(id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sipariş kalemleri</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...defaultOrderItem })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Ürün ekle
        </Button>
      </div>

      {fields.map((field, index) => {
        const lineTotal = calculateLineTotal(
          watchedItems[index]?.quantity ?? '',
          watchedItems[index]?.unitPrice ?? '',
        );
        const excludedIds = getSelectedProductIds(index);

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
                name={`items.${index}.productId`}
                render={({ field: productField }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Ürün</FormLabel>
                    <Select value={productField.value} onValueChange={productField.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ürün seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products
                          .filter(
                            (product) =>
                              product.id === productField.value ||
                              !excludedIds.includes(product.id),
                          )
                          .map((product) => (
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

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: quantityField }) => (
                  <FormItem>
                    <FormLabel>Miktar</FormLabel>
                    <FormControl>
                      <Input {...quantityField} inputMode="decimal" placeholder="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field: priceField }) => (
                  <FormItem>
                    <FormLabel>Birim fiyat</FormLabel>
                    <FormControl>
                      <Input {...priceField} inputMode="decimal" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Satır toplamı: {lineTotal !== null ? formatCurrency(lineTotal) : '—'}
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
