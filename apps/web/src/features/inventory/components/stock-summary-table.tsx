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
    return { label: 'Düşük stok', variant: 'warning' as const };
  }
  return { label: 'Stokta Var', variant: 'success' as const };
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
        title="Bu alanda henüz kayıt yok"
        description="Stok verileri satın alma kaydı oluşturulduğunda otomatik olarak görünür."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Malzeme</TableHead>
            <TableHead>Malzeme Kodu</TableHead>
            <TableHead>Şube</TableHead>
            <TableHead className="text-right">Kalan</TableHead>
            <TableHead>Birim</TableHead>
            <TableHead className="text-right">Ort. Birim Maliyet</TableHead>
            <TableHead className="text-right">Toplam Değer</TableHead>
            <TableHead className="text-right">Minimum Stok</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = getStockStatus(item);
            return (
              <TableRow key={`${item.branchId}-${item.ingredientId}`}>
                <TableCell className="max-w-[160px] truncate font-medium">
                  {item.ingredientName}
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell className="max-w-[140px] truncate">{item.branchName}</TableCell>
                <TableCell className="text-right">
                  {formatQuantityDisplay(item.totalRemaining)}
                </TableCell>
                <TableCell>{formatUnit(item.unit)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.weightedAverageUnitCost)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.totalValue)}</TableCell>
                <TableCell className="text-right">
                  {formatQuantityDisplay(item.minimumStockLevel)}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
