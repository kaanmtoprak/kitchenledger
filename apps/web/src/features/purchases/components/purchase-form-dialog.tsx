'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import type { Supplier } from '@/features/suppliers/types/supplier.types';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatCurrency } from '@/lib/utils/display';
import { PurchaseItemsFieldArray } from './purchase-items-field-array';
import {
  defaultPurchaseFormValues,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../schemas/purchase.schemas';
import { calculateItemsTotal } from '../types/purchase.types';

type PurchaseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  suppliers: Supplier[];
  ingredients: Ingredient[];
  onSubmit: (values: PurchaseFormValues) => Promise<void>;
};

export function PurchaseFormDialog({
  open,
  onOpenChange,
  branches,
  suppliers,
  ingredients,
  onSubmit,
}: PurchaseFormDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: defaultPurchaseFormValues,
  });

  const watchedItems = form.watch('items');

  const summary = useMemo(
    () => ({
      itemCount: watchedItems.filter((item) => item.ingredientId).length,
      totalCost: calculateItemsTotal(
        watchedItems.filter((item) => item.ingredientId && item.totalPrice),
      ),
    }),
    [watchedItems],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultPurchaseFormValues);
    } else {
      setError(null);
      form.reset(defaultPurchaseFormValues);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: PurchaseFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Satın alma oluşturulamadı.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Satın Alma Oluştur</DialogTitle>
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
                    <FormDescription>Stok bu şube altında takip edilir.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tedarikçi</FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tedarikçi Yok" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Tedarikçi Yok</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tedarikçi seçimi maliyet analizi için kullanılır.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satın Alma Tarihi</FormLabel>
                    <FormControl>
                      <DateTimeLocalInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatura Numarası</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="INV-1001" />
                    </FormControl>
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
                Her malzeme için satın alınan miktar ve toplam tutarı girin.
              </p>
              <PurchaseItemsFieldArray form={form} ingredients={ingredients} />
            </div>

            <div className="rounded-lg border bg-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{summary.itemCount} kalem</span>
                <span className="font-medium">
                  Toplam satın alma maliyeti: {formatCurrency(summary.totalCost)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Oluşturuluyor...' : 'Satın alma oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
