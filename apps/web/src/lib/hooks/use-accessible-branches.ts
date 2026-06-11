'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { branchesApi } from '@/features/branches/api/branches.api';
import type { ListBranchesParams } from '@/features/branches/types/branch.types';
import { useAuth } from '@/lib/auth/use-auth';
import {
  filterAccessibleBranches,
  getCurrentMembership,
  hasOrgWideBranchAccess,
} from '@/lib/branches/accessible-branches';

type UseAccessibleBranchesOptions = Pick<ListBranchesParams, 'includeInactive'> & {
  queryKeySuffix?: string;
};

export function useAccessibleBranches(options: UseAccessibleBranchesOptions = {}) {
  const { selectedOrganizationId, memberships } = useAuth();
  const { includeInactive, queryKeySuffix = 'accessible' } = options;

  const membership = useMemo(
    () => getCurrentMembership(memberships, selectedOrganizationId),
    [memberships, selectedOrganizationId],
  );

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, queryKeySuffix, includeInactive ?? false],
    queryFn: () =>
      branchesApi.list({
        page: 1,
        limit: 100,
        ...(includeInactive ? { includeInactive: true } : {}),
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const branches = useMemo(
    () => filterAccessibleBranches(branchesQuery.data?.data ?? [], membership),
    [branchesQuery.data, membership],
  );

  return {
    branches,
    branchesQuery,
    membership,
    hasOrgWideBranchAccess: hasOrgWideBranchAccess(membership),
    hasAccessibleBranches: branches.length > 0,
    isLoading: branchesQuery.isLoading,
  };
}
