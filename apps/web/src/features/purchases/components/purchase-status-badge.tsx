import { Badge } from '@/components/ui/badge';
import { formatPurchaseStatus } from '@/lib/utils/display';
import type { PurchaseStatus } from '../types/purchase.types';

type PurchaseStatusBadgeProps = {
  status: PurchaseStatus;
};

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <Badge variant={status === 'CANCELLED' ? 'secondary' : 'default'}>
      {formatPurchaseStatus(status)}
    </Badge>
  );
}
