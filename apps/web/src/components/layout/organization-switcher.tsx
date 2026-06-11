'use client';

import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/use-auth';
import { useCurrentOrganization } from '@/features/organizations/hooks/use-current-organization';

export function OrganizationSwitcher() {
  const { memberships, selectedOrganizationId, selectOrganization } = useAuth();
  const { organization } = useCurrentOrganization();

  if (memberships.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-[220px] justify-between gap-2">
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{organization?.name ?? 'İşletme seçin'}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>İşletmeler</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organizationId}
            onClick={() => selectOrganization(membership.organizationId)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{membership.organization.name}</span>
            {membership.organizationId === selectedOrganizationId ? (
              <Check className="h-4 w-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
