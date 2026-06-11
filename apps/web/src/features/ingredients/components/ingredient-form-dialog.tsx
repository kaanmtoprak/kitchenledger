'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatBaseUnit } from '@/lib/utils/display';
import {
  BASE_UNIT_OPTIONS,
  ingredientFormSchema,
  type IngredientFormValues,
} from '../schemas/ingredient.schemas';
import type { Ingredient } from '../types/ingredient.types';

type IngredientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
  onSubmit: (values: IngredientFormValues) => Promise<void>;
};

const defaultValues: IngredientFormValues = {
  name: '',
  sku: '',
  baseUnit: 'GRAM',
  minimumStockLevel: '',
  isActive: true,
};

function getFormValues(ingredient?: Ingredient | null): IngredientFormValues {
  if (!ingredient) {
    return defaultValues;
  }

  return {
    name: ingredient.name,
    sku: ingredient.sku,
    baseUnit: ingredient.baseUnit,
    minimumStockLevel: ingredient.minimumStockLevel ?? '',
    isActive: ingredient.isActive,
  };
}

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient,
  onSubmit,
}: IngredientFormDialogProps) {
  const isEdit = Boolean(ingredient);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    values: open ? getFormValues(ingredient) : defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: IngredientFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Malzeme kaydedilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Malzeme Düzenle' : 'Malzeme Oluştur'}</DialogTitle>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malzeme Kodu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temel Birim</FormLabel>
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

            <FormField
              control={form.control}
              name="minimumStockLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Stok Seviyesi</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="İsteğe bağlı" inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit ? (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value ?? true}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-4 w-4 rounded border border-input"
                      />
                      Aktif
                    </label>
                  </FormItem>
                )}
              />
            ) : null}

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
      </DialogContent>
    </Dialog>
  );
}
