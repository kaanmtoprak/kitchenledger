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
import { branchesApi } from '@/features/branches/api/branches.api';
import { teamApi } from '@/features/team/api/team.api';
import { TeamCreateDialog } from '@/features/team/components/team-create-dialog';
import { TeamEditDialog } from '@/features/team/components/team-edit-dialog';
import { TeamTable } from '@/features/team/components/team-table';
import type { TeamCreateFormValues } from '@/features/team/schemas/team.schemas';
import type { TeamEditFormValues } from '@/features/team/schemas/team.schemas';
import type { TeamMember } from '@/features/team/types/team.types';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { hasOrgWideBranchAccess } from '@/lib/auth/role-labels';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId, memberships } = useAuth();
  const permissions = usePermissions();

  const actorMembershipId = useMemo(
    () =>
      memberships.find((item) => item.organizationId === selectedOrganizationId)
        ?.membershipId,
    [memberships, selectedOrganizationId],
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [togglingMember, setTogglingMember] = useState<TeamMember | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const teamQuery = useQuery({
    queryKey: ['team', selectedOrganizationId],
    queryFn: () => teamApi.list(),
    enabled: Boolean(selectedOrganizationId) && permissions.canManageTeam,
  });

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, 'team-all'],
    queryFn: () => branchesApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId) && permissions.canManageTeam,
  });

  const branches = branchesQuery.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: teamApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team', selectedOrganizationId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      membershipId,
      payload,
    }: {
      membershipId: string;
      payload: Parameters<typeof teamApi.update>[1];
    }) => teamApi.update(membershipId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team', selectedOrganizationId] });
    },
  });

  const buildBranchPayload = (role: string, branchIds: string[]) => {
    if (hasOrgWideBranchAccess(role) && branchIds.length === 0) {
      return undefined;
    }

    return branchIds;
  };

  const handleCreate = async (values: TeamCreateFormValues) => {
    await createMutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
      branchIds: buildBranchPayload(values.role, values.branchIds),
    });
    setSuccessMessage('Kullanıcı oluşturuldu.');
  };

  const handleEdit = async (values: TeamEditFormValues) => {
    if (!editingMember) {
      return;
    }

    await updateMutation.mutateAsync({
      membershipId: editingMember.membershipId,
      payload: {
        role: values.role,
        branchIds: buildBranchPayload(values.role, values.branchIds),
        isActive: values.isActive,
      },
    });
    setSuccessMessage('Kullanıcı güncellendi.');
  };

  const handleToggleActive = async () => {
    if (!togglingMember) {
      return;
    }

    setToggleError(null);

    try {
      await updateMutation.mutateAsync({
        membershipId: togglingMember.membershipId,
        payload: { isActive: !togglingMember.isActive },
      });
      setSuccessMessage(
        togglingMember.isActive ? 'Kullanıcı pasife alındı.' : 'Kullanıcı aktifleştirildi.',
      );
      setTogglingMember(null);
    } catch (error) {
      setToggleError(getApiErrorMessage(error));
    }
  };

  if (!permissions.canManageTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kullanıcılar"
          description="Organizasyon kullanıcılarını, rollerini ve şube erişimlerini yönetin."
        />
        <Alert>
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        description="Organizasyon kullanıcılarını, rollerini ve şube erişimlerini yönetin."
        action={
          <Button type="button" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      <Card>
        <CardContent className="pt-6">
          {teamQuery.error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{getApiErrorMessage(teamQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          <TeamTable
            members={teamQuery.data ?? []}
            isLoading={teamQuery.isLoading}
            actorRole={permissions.role}
            actorMembershipId={actorMembershipId}
            onEdit={setEditingMember}
            onToggleActive={setTogglingMember}
            onCreate={() => setCreateDialogOpen(true)}
          />
        </CardContent>
      </Card>

      <TeamCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        actorRole={permissions.role}
        branches={branches}
        onSubmit={handleCreate}
      />

      <TeamEditDialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
          }
        }}
        member={editingMember}
        actorRole={permissions.role}
        actorMembershipId={actorMembershipId}
        branches={branches}
        onSubmit={handleEdit}
      />

      {toggleError ? (
        <Alert variant="destructive">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <ConfirmDialog
        open={Boolean(togglingMember)}
        onOpenChange={(open) => {
          if (!open) {
            setTogglingMember(null);
            setToggleError(null);
          }
        }}
        title={togglingMember?.isActive ? 'Kullanıcıyı pasife al' : 'Kullanıcıyı aktifleştir'}
        description={
          togglingMember?.isActive
            ? `${togglingMember.name} bu organizasyona erişemeyecek. Devam etmek istiyor musunuz?`
            : `${togglingMember?.name} tekrar bu organizasyona erişebilecek.`
        }
        confirmLabel={togglingMember?.isActive ? 'Pasife Al' : 'Aktifleştir'}
        onConfirm={handleToggleActive}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
