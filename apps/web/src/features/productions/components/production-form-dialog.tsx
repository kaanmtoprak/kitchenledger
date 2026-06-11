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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { Product } from '@/features/products/types/product.types';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { ProductionCostPreview } from './production-cost-preview';
import {
  defaultProductionFormValues,
  productionFormSchema,
  type ProductionFormValues,
} from '../schemas/production.schemas';

type ProductionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  products: Product[];
  onSubmit: (values: ProductionFormValues) => Promise<void>;
};

export function ProductionFormDialog({
  open,
  onOpenChange,
  branches,
  products,
  onSubmit,
}: ProductionFormDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: defaultProductionFormValues,
  });

  const watchedBranchId = form.watch('branchId');
  const watchedProductId = form.watch('productId');
  const watchedQuantity = form.watch('quantityProduced');

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultProductionFormValues);
    } else {
      setError(null);
      form.reset(defaultProductionFormValues);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: ProductionFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Üretim oluşturulamadı.'));
    }
  };

  const showCostPreview = Boolean(watchedBranchId && watchedProductId && watchedQuantity.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Üretim Oluştur</DialogTitle>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
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

            <FormField
              control={form.control}
              name="quantityProduced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Üretilen Miktar</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" placeholder="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="producedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Üretim Tarihi</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="İsteğe bağlı" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCostPreview ? (
              <ProductionCostPreview
                branchId={watchedBranchId}
                productId={watchedProductId}
                quantityProduced={watchedQuantity}
              />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Oluşturuluyor...' : 'Üretim oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
