import type { AppRole } from '@/lib/auth/permissions';

export const ROLE_LABELS: Record<AppRole, string> = {
  OWNER: 'Sahip',
  ADMIN: 'Yönetici',
  BRANCH_MANAGER: 'Şube Yöneticisi',
  STAFF: 'Personel',
  VIEWER: 'Görüntüleyici',
};

export function formatRole(role: string): string {
  return ROLE_LABELS[role as AppRole] ?? role;
}

export function getAssignableRoles(actorRole: AppRole | null): AppRole[] {
  if (actorRole === 'OWNER') {
    return ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'STAFF', 'VIEWER'];
  }

  if (actorRole === 'ADMIN') {
    return ['BRANCH_MANAGER', 'STAFF', 'VIEWER'];
  }

  return [];
}

export function hasOrgWideBranchAccess(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function requiresBranchSelection(role: string): boolean {
  return role === 'BRANCH_MANAGER' || role === 'STAFF' || role === 'VIEWER';
}

export function canManageTeamMember(
  actorRole: AppRole | null,
  actorMembershipId: string | undefined,
  member: { membershipId: string; role: string },
): boolean {
  if (!actorRole || (actorRole !== 'OWNER' && actorRole !== 'ADMIN')) {
    return false;
  }

  if (actorRole === 'ADMIN' && (member.role === 'OWNER' || member.role === 'ADMIN')) {
    return false;
  }

  return true;
}
