import type { Membership } from '@/features/auth/types/auth.types';
import type { Branch } from '@/features/branches/types/branch.types';

export const NO_ACCESSIBLE_BRANCHES_MESSAGE = 'Erişebileceğiniz şube bulunamadı.';

export function getCurrentMembership(
  memberships: Membership[],
  organizationId: string | null,
): Membership | null {
  if (!organizationId) {
    return null;
  }

  return memberships.find((membership) => membership.organizationId === organizationId) ?? null;
}

export function hasOrgWideBranchAccess(membership: Membership | null): boolean {
  return membership?.accessibleBranchIds === null;
}

export function filterAccessibleBranches(
  branches: Branch[],
  membership: Membership | null,
): Branch[] {
  if (!membership) {
    return [];
  }

  if (membership.accessibleBranchIds === null) {
    return branches;
  }

  if (!membership.accessibleBranchIds?.length) {
    return [];
  }

  const allowedIds = new Set(membership.accessibleBranchIds);
  return branches.filter((branch) => allowedIds.has(branch.id));
}
