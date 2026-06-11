'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUS_OPTIONS, formatOrderStatus } from '@/lib/utils/display';
import type { OrderStatus } from '../types/order.types';

type OrderStatusSelectProps = {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
};

export function OrderStatusSelect({
  value,
  onChange,
  disabled,
  className,
}: OrderStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as OrderStatus)} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Durum seçin" />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            {formatOrderStatus(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
