'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/use-auth';

export function useCurrentOrganization() {
  const { memberships, selectedOrganizationId } = useAuth();

  const currentOrganization = useMemo(
    () => memberships.find((membership) => membership.organizationId === selectedOrganizationId),
    [memberships, selectedOrganizationId],
  );

  return {
    organization: currentOrganization?.organization ?? null,
    role: currentOrganization?.role ?? null,
    selectedOrganizationId,
  };
}
