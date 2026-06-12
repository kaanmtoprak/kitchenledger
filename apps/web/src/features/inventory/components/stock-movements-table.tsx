'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import {
  formatDateTime,
  formatMovementType,
  formatQuantityDisplay,
  formatUnit,
} from '@/lib/utils/display';
import type { BadgeProps } from '@/components/ui/badge';
import type { StockMovementItem, StockMovementType } from '../types/inventory.types';

function getMovementBadgeVariant(type: StockMovementType): NonNullable<BadgeProps['variant']> {
  switch (type) {
    case 'PURCHASE':
      return 'info';
    case 'PRODUCTION_CONSUMPTION':
      return 'warning';
    case 'MANUAL_ADJUSTMENT':
      return 'muted';
    case 'WASTE':
      return 'destructive';
    case 'RETURN':
      return 'success';
    default:
      return 'outline';
  }
}

type StockMovementsTableProps = {
  items: StockMovementItem[];
  isLoading?: boolean;
};

export function StockMovementsTable({ items, isLoading }: StockMovementsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Henüz stok hareketi yok"
        description="Hareketler satın alma, üretim ve düzeltmelerle oluşturulur."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tür</TableHead>
            <TableHead>Malzeme</TableHead>
            <TableHead>Şube</TableHead>
            <TableHead className="whitespace-nowrap">Miktar</TableHead>
            <TableHead>Birim</TableHead>
            <TableHead className="min-w-[140px]">Neden</TableHead>
            <TableHead className="whitespace-nowrap">Oluşturulma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap">
                <Badge variant={getMovementBadgeVariant(item.type)}>
                  {formatMovementType(item.type)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[140px] truncate font-medium">
                {item.ingredient.name}
              </TableCell>
              <TableCell className="max-w-[120px] truncate">{item.branch.name}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatQuantityDisplay(item.quantity)}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatUnit(item.unit)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.reason?.trim() ? item.reason : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(item.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
