'use client';

import { Eye } from 'lucide-react';
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
import { formatCurrency, formatDateTime } from '@/lib/utils/display';
import { calculateItemsTotal, type PurchaseListItem } from '../types/purchase.types';

type PurchasesTableProps = {
  purchases: PurchaseListItem[];
  branchNameById: Record<string, string>;
  supplierNameById: Record<string, string>;
  isLoading?: boolean;
  canCreate?: boolean;
  onView: (purchase: PurchaseListItem) => void;
  onCreate?: () => void;
};

function displayNotes(notes: string | null) {
  if (!notes?.trim()) {
    return '—';
  }
  return notes.length > 40 ? `${notes.slice(0, 40)}…` : notes;
}

export function PurchasesTable({
  purchases,
  branchNameById,
  supplierNameById,
  isLoading,
  canCreate = true,
  onView,
  onCreate,
}: PurchasesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canCreate, 'Henüz satın alma kaydı yok')}
        description={
          canCreate
            ? 'Malzeme satın alması eklediğinizde stok partileri ve stok hareketleri otomatik oluşur.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canCreate ? (
            <Button type="button" onClick={onCreate}>
              Yeni Satın Alma
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
            <TableHead>Satın Alma Tarihi</TableHead>
            <TableHead>Fatura No</TableHead>
            <TableHead>Şube</TableHead>
            <TableHead>Tedarikçi</TableHead>
            <TableHead className="text-right">Kalemler</TableHead>
            <TableHead className="text-right">Toplam Maliyet</TableHead>
            <TableHead>Notlar</TableHead>
            <TableHead>Oluşturulma</TableHead>
            <TableHead className="w-12 text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => {
            const total = purchase.items ? calculateItemsTotal(purchase.items) : null;

            return (
              <TableRow key={purchase.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(purchase.purchasedAt)}
                </TableCell>
                <TableCell>{purchase.invoiceNumber?.trim() ? purchase.invoiceNumber : '—'}</TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {branchNameById[purchase.branchId] ?? purchase.branchId}
                </TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {purchase.supplierId
                    ? (supplierNameById[purchase.supplierId] ?? purchase.supplierId)
                    : 'Tedarikçi Yok'}
                </TableCell>
                <TableCell className="text-right">{purchase.items?.length ?? '—'}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {total !== null && purchase.items ? formatCurrency(total) : '—'}
                </TableCell>
                <TableCell className="max-w-[160px]">{displayNotes(purchase.notes)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(purchase.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(purchase)}
                    aria-label="Satın alma detayını görüntüle"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
