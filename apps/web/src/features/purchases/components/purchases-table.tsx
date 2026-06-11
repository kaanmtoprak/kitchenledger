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
        title="Henüz satın alma yok"
        description="Stoka parti eklemek için ilk satın almanızı oluşturun."
        action={
          onCreate && canCreate ? (
            <Button type="button" onClick={onCreate}>
              Satın Alma Oluştur
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
          <TableHead>Satın Alma Tarihi</TableHead>
          <TableHead>Fatura No</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Tedarikçi</TableHead>
          <TableHead>Kalemler</TableHead>
          <TableHead>Toplam Maliyet</TableHead>
          <TableHead>Notlar</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="w-[90px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((purchase) => {
          const total = purchase.items ? calculateItemsTotal(purchase.items) : null;

          return (
            <TableRow key={purchase.id}>
              <TableCell>{formatDateTime(purchase.purchasedAt)}</TableCell>
              <TableCell>{purchase.invoiceNumber?.trim() ? purchase.invoiceNumber : '—'}</TableCell>
              <TableCell>{branchNameById[purchase.branchId] ?? purchase.branchId}</TableCell>
              <TableCell>
                {purchase.supplierId
                  ? (supplierNameById[purchase.supplierId] ?? purchase.supplierId)
                  : 'Tedarikçi Yok'}
              </TableCell>
              <TableCell>{purchase.items?.length ?? '—'}</TableCell>
              <TableCell>
                {total !== null && purchase.items ? formatCurrency(total) : '—'}
              </TableCell>
              <TableCell>{displayNotes(purchase.notes)}</TableCell>
              <TableCell>{formatDateTime(purchase.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="outline" size="sm" onClick={() => onView(purchase)}>
                  <Eye className="mr-1 h-4 w-4" />
                  Detayı Gör
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
