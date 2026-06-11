'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { SuccessAlert } from '@/components/common/success-alert';
import { TablePagination } from '@/components/common/table-pagination';
import { branchesApi } from '@/features/branches/api/branches.api';
import { BranchFormDialog } from '@/features/branches/components/branch-form-dialog';
import {
  BranchesFilters,
  type BranchesFilterState,
} from '@/features/branches/components/branches-filters';
import { BranchesTable } from '@/features/branches/components/branches-table';
import type { BranchFormValues } from '@/features/branches/schemas/branch.schemas';
import type { Branch } from '@/features/branches/types/branch.types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [filters, setFilters] = useState<BranchesFilterState>({
    search: '',
    includeInactive: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<Branch | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.includeInactive}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const setPage = (nextPage: number) => {
    setPagination({ filterKey, page: nextPage });
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      q: debouncedSearch || undefined,
      includeInactive: filters.includeInactive || undefined,
    }),
    [page, debouncedSearch, filters.includeInactive],
  );

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, queryParams],
    queryFn: () => branchesApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['branches', selectedOrganizationId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof branchesApi.update>[1];
    }) => branchesApi.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['branches', selectedOrganizationId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: branchesApi.deactivate,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['branches', selectedOrganizationId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      setDeactivatingBranch(null);
      setDeactivateError(null);
    },
  });

  const openCreateDialog = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: BranchFormValues) => {
    setSuccessMessage(null);
    const payload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      ...(editingBranch ? { isActive: values.isActive ?? true } : {}),
    };

    if (editingBranch) {
      await updateMutation.mutateAsync({ id: editingBranch.id, payload });
      setSuccessMessage('Şube güncellendi.');
      return;
    }

    await createMutation.mutateAsync({
      name: payload.name,
      code: payload.code,
    });
    setSuccessMessage('Şube oluşturuldu.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şubeler"
        description="Şube ve lokasyon bazlı stok hareketlerini yönetin."
        action={
          permissions.canManageBranches ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Şube Oluştur
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <BranchesFilters filters={filters} onChange={setFilters} />

          {branchesQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(branchesQuery.error, 'Şubeler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <BranchesTable
            branches={branchesQuery.data?.data ?? []}
            isLoading={branchesQuery.isLoading}
            canManage={permissions.canManageBranches}
            onEdit={openEditDialog}
            onDeactivate={setDeactivatingBranch}
            onCreate={permissions.canManageBranches ? openCreateDialog : undefined}
          />

          <TablePagination meta={branchesQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canManageBranches ? (
        <BranchFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          branch={editingBranch}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deactivateError ? (
        <Alert variant="destructive">
          <AlertDescription>{deactivateError}</AlertDescription>
        </Alert>
      ) : null}

      {permissions.canManageBranches ? (
        <ConfirmDialog
          open={Boolean(deactivatingBranch)}
          onOpenChange={(open) => {
            if (!open) {
              setDeactivatingBranch(null);
              setDeactivateError(null);
            }
          }}
          title="Şubeyi pasife al?"
          description={
            deactivatingBranch
              ? `"${deactivatingBranch.name}" pasif olarak işaretlenecek ve varsayılan listelerde gizlenecek.`
              : ''
          }
          confirmLabel="Pasife Al"
          isLoading={deactivateMutation.isPending}
          onConfirm={() => {
            if (!deactivatingBranch) {
              return;
            }
            deactivateMutation.mutate(deactivatingBranch.id, {
              onSuccess: () => {
                setSuccessMessage('Şube pasife alındı.');
              },
              onError: (error) => {
                setDeactivateError(getApiErrorMessage(error, 'Şube pasife alınamadı.'));
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
