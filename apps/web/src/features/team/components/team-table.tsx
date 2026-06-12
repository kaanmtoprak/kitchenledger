'use client';

import { MoreHorizontal, Pencil, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import {
  canManageTeamMember,
  hasOrgWideBranchAccess,
} from '@/lib/auth/role-labels';
import type { AppRole } from '@/lib/auth/permissions';
import { formatDate, formatDateTime } from '@/lib/utils/display';
import type { TeamMember } from '../types/team.types';
import { RoleBadge } from './role-badge';

type TeamTableProps = {
  members: TeamMember[];
  isLoading?: boolean;
  actorRole: AppRole | null;
  actorMembershipId?: string;
  onEdit: (member: TeamMember) => void;
  onToggleActive: (member: TeamMember) => void;
  onCreate?: () => void;
};

function formatBranchAccess(member: TeamMember): string {
  if (hasOrgWideBranchAccess(member.role)) {
    return 'Tüm şubeler';
  }

  if (member.branches.length === 0) {
    return 'Şube atanmadı';
  }

  return member.branches.map((branch) => branch.name).join(', ');
}

export function TeamTable({
  members,
  isLoading,
  actorRole,
  actorMembershipId,
  onEdit,
  onToggleActive,
  onCreate,
}: TeamTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="Henüz kullanıcı yok"
        description="Organizasyonunuza yeni kullanıcı ekleyerek ekip erişimlerini yönetmeye başlayın."
        action={
          onCreate ? (
            <Button type="button" onClick={onCreate}>
              Yeni Kullanıcı
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Şube Erişimi</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Son Giriş</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="w-[70px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const canManage = canManageTeamMember(actorRole, actorMembershipId, member);
          const isSelf = member.membershipId === actorMembershipId;

          return (
            <TableRow key={member.membershipId}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <RoleBadge role={member.role} />
              </TableCell>
              <TableCell className="max-w-[220px] truncate" title={formatBranchAccess(member)}>
                {formatBranchAccess(member)}
              </TableCell>
              <TableCell>
                <Badge variant={member.isActive ? 'success' : 'destructive'}>
                  {member.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </TableCell>
              <TableCell>
                {member.lastLoginAt ? formatDateTime(member.lastLoginAt) : '—'}
              </TableCell>
              <TableCell>{formatDate(member.createdAt)}</TableCell>
              <TableCell className="text-right">
                {canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">İşlemler</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(member)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      {!isSelf ? (
                        <DropdownMenuItem onClick={() => onToggleActive(member)}>
                          <UserX className="mr-2 h-4 w-4" />
                          {member.isActive ? 'Pasife Al' : 'Aktifleştir'}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
