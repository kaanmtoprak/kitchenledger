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
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { branchFormSchema, type BranchFormValues } from '../schemas/branch.schemas';
import type { Branch } from '../types/branch.types';

type BranchFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  onSubmit: (values: BranchFormValues) => Promise<void>;
};

const defaultValues: BranchFormValues = {
  name: '',
  code: '',
  isActive: true,
};

function getFormValues(branch?: Branch | null): BranchFormValues {
  if (!branch) {
    return defaultValues;
  }

  return {
    name: branch.name,
    code: branch.code,
    isActive: branch.isActive,
  };
}

export function BranchFormDialog({ open, onOpenChange, branch, onSubmit }: BranchFormDialogProps) {
  const isEdit = Boolean(branch);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    values: open ? getFormValues(branch) : defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: BranchFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Şube kaydedilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Şube Düzenle' : 'Şube Oluştur'}</DialogTitle>
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
                    <Input {...field} placeholder="Beşiktaş Şubesi" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="BESIKTAS"
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
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
