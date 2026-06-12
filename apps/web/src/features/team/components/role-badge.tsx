import { Badge } from '@/components/ui/badge';
import { formatRole } from '@/lib/auth/role-labels';
import type { AppRole } from '@/lib/auth/permissions';

const roleVariants: Record<
  AppRole,
  'default' | 'secondary' | 'info' | 'warning' | 'muted'
> = {
  OWNER: 'default',
  ADMIN: 'info',
  BRANCH_MANAGER: 'warning',
  STAFF: 'secondary',
  VIEWER: 'muted',
};

type RoleBadgeProps = {
  role: string;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const variant = roleVariants[role as AppRole] ?? 'secondary';

  return <Badge variant={variant}>{formatRole(role)}</Badge>;
}
