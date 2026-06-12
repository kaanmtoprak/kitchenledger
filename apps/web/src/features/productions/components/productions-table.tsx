'use client';

import { Ban, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { emptyListTitle, READ_ONLY_EMPTY_HINT } from '@/lib/utils/empty-state-messages';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatQuantityDisplay } from '@/lib/utils/display';
import { ProductionStatusBadge } from './production-status-badge';
import { isProductionActive, type ProductionListItem } from '../types/production.types';

type ProductionsTableProps = {
  productions: ProductionListItem[];
  isLoading?: boolean;
  canCreate?: boolean;
  canCancel?: boolean;
  onView: (production: ProductionListItem) => void;
  onCancel?: (production: ProductionListItem) => void;
  onCreate?: () => void;
};

export function ProductionsTable({
  productions,
  isLoading,
  canCreate = true,
  canCancel = false,
  onView,
  onCancel,
  onCreate,
}: ProductionsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (productions.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canCreate, 'Henüz üretim kaydı yok')}
        description={
          canCreate
            ? 'Üretim kaydı oluşturduğunuzda FIFO ile stok tüketilir ve maliyet anlık görüntüsü saklanır.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canCreate ? (
            <Button type="button" onClick={onCreate}>
              Üretim Oluştur
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Üretim Tarihi</TableHead>
            <TableHead>Ürün</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Ürün Kodu</TableHead>
            <TableHead>Şube</TableHead>
            <TableHead className="text-right">Üretilen Miktar</TableHead>
            <TableHead className="text-right">Toplam Maliyet</TableHead>
            <TableHead className="text-right">Birim Maliyet</TableHead>
            <TableHead>Notlar</TableHead>
            <TableHead className="w-24 text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productions.map((production) => {
            const isCancelled = !isProductionActive(production.status);

            return (
              <TableRow key={production.id} className={cn(isCancelled && 'opacity-60')}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(production.producedAt)}
                </TableCell>
                <TableCell className="max-w-[160px] truncate font-medium">
                  {production.productName}
                </TableCell>
                <TableCell>
                  <ProductionStatusBadge status={production.status} />
                </TableCell>
                <TableCell>{production.productSku}</TableCell>
                <TableCell className="max-w-[140px] truncate">{production.branchName}</TableCell>
                <TableCell className="text-right">
                  {formatQuantityDisplay(production.quantityProduced)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCurrency(production.totalCostSnapshot)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCurrency(production.unitCostSnapshot)}
                </TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {production.notes?.trim() ? production.notes : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canCancel && onCancel && isProductionActive(production.status) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onCancel(production)}
                        aria-label="Üretimi iptal et"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(production)}
                      aria-label="Üretim detayını görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
