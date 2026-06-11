'use client';

import { Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatCurrency, formatDate, formatQuantityDisplay } from '@/lib/utils/display';
import type { ProductionListItem } from '../types/production.types';

type ProductionsTableProps = {
  productions: ProductionListItem[];
  isLoading?: boolean;
  canCreate?: boolean;
  onView: (production: ProductionListItem) => void;
  onCreate?: () => void;
};

export function ProductionsTable({
  productions,
  isLoading,
  canCreate = true,
  onView,
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
        title="Henüz üretim kaydı yok"
        description="Stok tüketmek ve FIFO maliyet anlık görüntüsü almak için ilk üretiminizi kaydedin."
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Üretim Tarihi</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead>Ürün Kodu</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Üretilen Miktar</TableHead>
          <TableHead>Toplam Maliyet</TableHead>
          <TableHead>Birim Maliyet</TableHead>
          <TableHead>Notlar</TableHead>
          <TableHead className="w-[70px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {productions.map((production) => (
          <TableRow key={production.id}>
            <TableCell>{formatDate(production.producedAt)}</TableCell>
            <TableCell className="font-medium">{production.productName}</TableCell>
            <TableCell>{production.productSku}</TableCell>
            <TableCell>{production.branchName}</TableCell>
            <TableCell>{formatQuantityDisplay(production.quantityProduced)}</TableCell>
            <TableCell>{formatCurrency(production.totalCostSnapshot)}</TableCell>
            <TableCell>{formatCurrency(production.unitCostSnapshot)}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {production.notes?.trim() ? production.notes : '—'}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(production)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Detayı Gör
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
