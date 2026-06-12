import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatOrderStatus } from '@/lib/utils/display';
import type { OrderStatus } from '../types/order.types';

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

function getVariant(status: OrderStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
      return 'info';
    case 'IN_PRODUCTION':
      return 'info';
    case 'READY':
      return 'success';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'muted';
  }
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)} className={cn(className)}>
      {formatOrderStatus(status)}
    </Badge>
  );
}
