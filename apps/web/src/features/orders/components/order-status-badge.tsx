import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatOrderStatus } from '@/lib/utils/display';
import type { OrderStatus } from '../types/order.types';

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

function getVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'CONFIRMED':
      return 'default';
    case 'IN_PRODUCTION':
    case 'READY':
      return 'outline';
    case 'DELIVERED':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const variant = getVariant(status);

  return (
    <Badge
      variant={variant}
      className={cn(
        status === 'DELIVERED' &&
          'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
        className,
      )}
    >
      {formatOrderStatus(status)}
    </Badge>
  );
}
