import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { createPermissions, type Permissions } from './permissions';

export function usePermissions(): Permissions {
  const { memberships, selectedOrganizationId } = useAuth();

  return useMemo(() => {
    const membership = memberships.find((item) => item.organizationId === selectedOrganizationId);
    return createPermissions(membership?.role);
  }, [memberships, selectedOrganizationId]);
}
