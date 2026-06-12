'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateTimeLocalInput } from '@/components/common/datetime-local-input';
import { FormDialogContent } from '@/components/common/form-dialog-content';
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
import { formatCurrency, formatDateTime } from '@/lib/utils/display';
import { OrderItemsFieldArray } from './order-items-field-array';
import {
  defaultOrderFormValues,
  getFormValuesFromOrder,
  orderFormSchema,
  type OrderFormValues,
} from '../schemas/order.schemas';
import type { OrderDetail } from '../types/order.types';
import { calculateOrderItemsTotal } from '../types/order.types';

type OrderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  products: Product[];
  mode?: 'create' | 'edit';
  order?: OrderDetail | null;
  isLoading?: boolean;
  onSubmit: (values: OrderFormValues, mode: 'create' | 'edit') => Promise<void>;
};

export function OrderFormDialog({
  open,
  onOpenChange,
  branches,
  products,
  mode = 'create',
  order,
  isLoading = false,
  onSubmit,
}: OrderFormDialogProps) {
  const isEdit = mode === 'edit';
  const [error, setError] = useState<string | null>(null);

  const formValues = useMemo(
    () => (isEdit && order ? getFormValuesFromOrder(order) : defaultOrderFormValues),
    [isEdit, order],
  );

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    values: open ? formValues : defaultOrderFormValues,
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const summary = useMemo(() => {
    const items = watchedItems ?? defaultOrderFormValues.items;
    return {
      itemCount: items.filter((item) => item.productId).length,
      total: calculateOrderItemsTotal(items),
    };
  }, [watchedItems]);

  const editBranch = isEdit && order ? order.branch : null;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: OrderFormValues) => {
    setError(null);
    try {
      await onSubmit(values, isEdit ? 'edit' : 'create');
      handleOpenChange(false);
    } catch (err) {
      setError(
        getApiErrorMessage(err, isEdit ? 'Sipariş güncellenemedi.' : 'Sipariş oluşturulamadı.'),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Siparişi Düzenle' : 'Yeni Sipariş'}</DialogTitle>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {!isLoading || !isEdit ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {isEdit && editBranch ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Şube</p>
                    <p className="font-medium">
                      {editBranch.name} ({editBranch.code})
                    </p>
                  </div>
                ) : (
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
                )}

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

                {isEdit && order ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Sipariş tarihi</p>
                    <p className="font-medium">{formatDateTime(order.orderedAt)}</p>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="orderedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş tarihi</FormLabel>
                        <FormControl>
                          <DateTimeLocalInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="dueAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslim tarihi</FormLabel>
                      <FormControl>
                        <DateTimeLocalInput {...field} />
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

              <div className="rounded-lg border bg-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{summary.itemCount} kalem</span>
                  <span className="font-medium">Genel toplam: {formatCurrency(summary.total)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Vazgeç
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? isEdit
                      ? 'Güncelleniyor...'
                      : 'Oluşturuluyor...'
                    : isEdit
                      ? 'Siparişi Güncelle'
                      : 'Sipariş oluştur'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </FormDialogContent>
    </Dialog>
  );
}
