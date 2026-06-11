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
  formatCurrency,
  formatDateTime,
  formatQuantityDisplay,
  formatUnit,
} from '@/lib/utils/display';
import type { StockBatchItem } from '../types/inventory.types';

type StockBatchesTableProps = {
  items: StockBatchItem[];
  isLoading?: boolean;
};

function getBatchStatus(remainingQuantity: string) {
  const remaining = Number.parseFloat(remainingQuantity);
  if (!Number.isNaN(remaining) && remaining > 0) {
    return { label: 'Mevcut', variant: 'secondary' as const };
  }
  return { label: 'Tükendi', variant: 'outline' as const };
}

export function StockBatchesTable({ items, isLoading }: StockBatchesTableProps) {
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
        title="Stok partisi bulunamadı"
        description="Partiler, satın almalar kaydedildikten sonra görünür."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Malzeme</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Başlangıç Miktarı</TableHead>
          <TableHead>Kalan</TableHead>
          <TableHead>Birim</TableHead>
          <TableHead>Birim Maliyet</TableHead>
          <TableHead>Alınma Tarihi</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const status = getBatchStatus(item.remainingQuantity);
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.ingredient.name}</TableCell>
              <TableCell>{item.branch.name}</TableCell>
              <TableCell>{formatQuantityDisplay(item.initialQuantity)}</TableCell>
              <TableCell>{formatQuantityDisplay(item.remainingQuantity)}</TableCell>
              <TableCell>{formatUnit(item.unit)}</TableCell>
              <TableCell>{formatCurrency(item.unitCost)}</TableCell>
              <TableCell>{formatDateTime(item.receivedAt)}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
