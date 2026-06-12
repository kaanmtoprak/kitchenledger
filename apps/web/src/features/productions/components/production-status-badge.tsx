import { Badge } from '@/components/ui/badge';
import { formatProductionStatus } from '@/lib/utils/display';
import type { ProductionStatus } from '../types/production.types';

type ProductionStatusBadgeProps = {
  status: ProductionStatus;
};

export function ProductionStatusBadge({ status }: ProductionStatusBadgeProps) {
  return (
    <Badge variant={status === 'CANCELLED' ? 'secondary' : 'default'}>
      {formatProductionStatus(status)}
    </Badge>
  );
}
