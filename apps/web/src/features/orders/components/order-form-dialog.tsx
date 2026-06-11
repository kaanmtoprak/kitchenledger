'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
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
import { BranchFormSelect } from '@/components/common/branch-form-select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { Product } from '@/features/products/types/product.types';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatCurrency } from '@/lib/utils/display';
import { OrderItemsFieldArray } from './order-items-field-array';
import {
  defaultOrderFormValues,
  orderFormSchema,
  type OrderFormValues,
} from '../schemas/order.schemas';
import { calculateOrderItemsTotal } from '../types/order.types';

type OrderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  products: Product[];
  onSubmit: (values: OrderFormValues) => Promise<void>;
};

export function OrderFormDialog({
  open,
  onOpenChange,
  branches,
  products,
  onSubmit,
}: OrderFormDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: defaultOrderFormValues,
  });

  const watchedItems = form.watch('items');

  const summary = useMemo(
    () => ({
      itemCount: watchedItems.filter((item) => item.productId).length,
      total: calculateOrderItemsTotal(
        watchedItems.filter((item) => item.productId && item.quantity && item.unitPrice),
      ),
    }),
    [watchedItems],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultOrderFormValues);
    } else {
      setError(null);
      form.reset(defaultOrderFormValues);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: OrderFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sipariş oluşturulamadı.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Yeni Sipariş</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
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
                    <FormDescription>Sipariş bu şube altında takip edilir.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri adı</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ayşe Yılmaz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+90 5xx xxx xx xx" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="musteri@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sipariş tarihi</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslim tarihi</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Opsiyoneldir; sipariş takibi için kullanılabilir.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="İsteğe bağlı" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Her ürün için miktar ve satış fiyatını girin.
              </p>
              <OrderItemsFieldArray form={form} products={products} />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{summary.itemCount} kalem</span>
                <span className="font-medium">
                  Genel toplam: {formatCurrency(summary.total)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Oluşturuluyor...' : 'Sipariş oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
