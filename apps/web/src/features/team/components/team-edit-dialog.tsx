'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import { formatRole, getAssignableRoles, requiresBranchSelection } from '@/lib/auth/role-labels';
import type { AppRole } from '@/lib/auth/permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { teamEditSchema, type TeamEditFormValues } from '../schemas/team.schemas';
import type { TeamMember } from '../types/team.types';
import { BranchAccessSelector } from './branch-access-selector';

type TeamEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  actorRole: AppRole | null;
  actorMembershipId?: string;
  branches: Branch[];
  onSubmit: (values: TeamEditFormValues) => Promise<void>;
};

function getFormValues(member: TeamMember | null): TeamEditFormValues {
  if (!member) {
    return {
      role: 'STAFF',
      branchIds: [],
      isActive: true,
    };
  }

  return {
    role: member.role,
    branchIds: member.branches.map((branch) => branch.id),
    isActive: member.isActive,
  };
}

export function TeamEditDialog({
  open,
  onOpenChange,
  member,
  actorRole,
  actorMembershipId,
  branches,
  onSubmit,
}: TeamEditDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const assignableRoles = useMemo(() => getAssignableRoles(actorRole), [actorRole]);
  const isSelf = member?.membershipId === actorMembershipId;

  const form = useForm<TeamEditFormValues>({
    resolver: zodResolver(teamEditSchema),
    values: open ? getFormValues(member) : getFormValues(null),
  });

  const selectedRole = useWatch({ control: form.control, name: 'role' });

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);

    if (requiresBranchSelection(values.role) && values.branchIds.length === 0) {
      setError('Bu rol için en az bir şube seçilmelidir.');
      return;
    }

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          {member ? (
            <p className="text-sm text-muted-foreground">
              {member.name} · {member.email}
            </p>
          ) : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={isSelf}
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
                  {isSelf ? (
                    <p className="text-xs text-muted-foreground">
                      Kendi rolünüzü değiştiremezsiniz.
                    </p>
                  ) : null}
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select
                    value={field.value ? 'active' : 'inactive'}
                    onValueChange={(value) => field.onChange(value === 'active')}
                    disabled={isSelf}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf ? (
                    <p className="text-xs text-muted-foreground">
                      Kendi üyeliğinizi pasife alamazsınız.
                    </p>
                  ) : null}
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
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
