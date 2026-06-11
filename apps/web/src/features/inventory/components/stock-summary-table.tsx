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
import { formatCurrency, formatQuantityDisplay, formatUnit } from '@/lib/utils/display';
import type { StockSummaryItem } from '../types/inventory.types';

type StockSummaryTableProps = {
  items: StockSummaryItem[];
  isLoading?: boolean;
};

function getStockStatus(item: StockSummaryItem) {
  const remaining = Number.parseFloat(item.totalRemaining);
  if (!Number.isNaN(remaining) && remaining <= 0) {
    return { label: 'Stokta yok', variant: 'destructive' as const };
  }
  if (item.isLowStock) {
    return { label: 'Düşük stok', variant: 'outline' as const };
  }
  return { label: 'Stokta Var', variant: 'secondary' as const };
}

export function StockSummaryTable({ items, isLoading }: StockSummaryTableProps) {
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
        title="Stok bulunamadı"
        description="Stok takibine başlamak için bir satın alma oluşturun."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Malzeme</TableHead>
          <TableHead>Malzeme Kodu</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Kalan</TableHead>
          <TableHead>Birim</TableHead>
          <TableHead>Ort. Birim Maliyet</TableHead>
          <TableHead>Toplam Değer</TableHead>
          <TableHead>Minimum Stok</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const status = getStockStatus(item);
          return (
            <TableRow key={`${item.branchId}-${item.ingredientId}`}>
              <TableCell className="font-medium">{item.ingredientName}</TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell>{item.branchName}</TableCell>
              <TableCell>{formatQuantityDisplay(item.totalRemaining)}</TableCell>
              <TableCell>{formatUnit(item.unit)}</TableCell>
              <TableCell>{formatCurrency(item.weightedAverageUnitCost)}</TableCell>
              <TableCell>{formatCurrency(item.totalValue)}</TableCell>
              <TableCell>{formatQuantityDisplay(item.minimumStockLevel)}</TableCell>
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
