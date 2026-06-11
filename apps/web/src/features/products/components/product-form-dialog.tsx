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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { productFormSchema, type ProductFormValues } from '../schemas/product.schemas';
import type { Product } from '../types/product.types';

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const defaultValues: ProductFormValues = {
  name: '',
  sku: '',
  description: '',
  defaultServingCount: '',
  isActive: true,
};

function getFormValues(product?: Product | null): ProductFormValues {
  if (!product) {
    return defaultValues;
  }

  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    defaultServingCount: product.defaultServingCount,
    isActive: product.isActive,
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  const isEdit = Boolean(product);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    values: open ? getFormValues(product) : defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ürün kaydedilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ürün Düzenle' : 'Ürün Oluştur'}</DialogTitle>
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
                  <FormLabel>Ürün Kodu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Ürünü sistem içinde ayırt etmek için kullanılan kısa kod.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="İsteğe bağlı" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultServingCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Varsayılan Porsiyon</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="İsteğe bağlı (varsayılan: 1)"
                      inputMode="decimal"
                    />
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
