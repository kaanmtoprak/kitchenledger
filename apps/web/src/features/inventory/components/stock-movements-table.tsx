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
import type { StockMovementItem } from '../types/inventory.types';

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tür</TableHead>
          <TableHead>Malzeme</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Miktar</TableHead>
          <TableHead>Birim</TableHead>
          <TableHead>Neden</TableHead>
          <TableHead>Oluşturulma</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Badge variant="outline">{formatMovementType(item.type)}</Badge>
            </TableCell>
            <TableCell className="font-medium">{item.ingredient.name}</TableCell>
            <TableCell>{item.branch.name}</TableCell>
            <TableCell>{formatQuantityDisplay(item.quantity)}</TableCell>
            <TableCell>{formatUnit(item.unit)}</TableCell>
            <TableCell>{item.reason?.trim() ? item.reason : '—'}</TableCell>
            <TableCell>{formatDateTime(item.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
