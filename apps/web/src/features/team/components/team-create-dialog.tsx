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
import type { Branch } from '@/features/branches/types/branch.types';
import {
  formatRole,
  getAssignableRoles,
  requiresBranchSelection,
} from '@/lib/auth/role-labels';
import type { AppRole } from '@/lib/auth/permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import {
  teamCreateSchema,
  type TeamCreateFormValues,
} from '../schemas/team.schemas';
import { BranchAccessSelector } from './branch-access-selector';

type TeamCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actorRole: AppRole | null;
  branches: Branch[];
  onSubmit: (values: TeamCreateFormValues) => Promise<void>;
};

const defaultValues: TeamCreateFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'STAFF',
  branchIds: [],
};

export function TeamCreateDialog({
  open,
  onOpenChange,
  actorRole,
  branches,
  onSubmit,
}: TeamCreateDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const assignableRoles = useMemo(() => getAssignableRoles(actorRole), [actorRole]);

  const form = useForm<TeamCreateFormValues>({
    resolver: zodResolver(teamCreateSchema),
    values: open
      ? {
          ...defaultValues,
          role: assignableRoles.includes('STAFF')
            ? 'STAFF'
            : (assignableRoles[0] ?? 'STAFF'),
        }
      : defaultValues,
  });

  const selectedRole = form.watch('role');

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);

    if (requiresBranchSelection(values.role) && values.branchIds.length === 0) {
      setError('Bu rol için en az bir şube seçilmelidir.');
      return;
    }

    try {
      await onSubmit(values);
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (!requiresBranchSelection(value)) {
                        form.setValue('branchIds', []);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {formatRole(role)}
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
              name="branchIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şube Erişimi</FormLabel>
                  <BranchAccessSelector
                    role={selectedRole}
                    branches={branches}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
