'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import {
  formatCurrency,
  formatDateTime,
  formatQuantityDisplay,
  formatUnit,
} from '@/lib/utils/display';
import { purchasesApi } from '../api/purchases.api';
import { PurchaseCancelDialog } from './purchase-cancel-dialog';
import { PurchaseStatusBadge } from './purchase-status-badge';
import { calculateItemsTotal, isPurchaseActive } from '../types/purchase.types';

type PurchaseDetailDialogProps = {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canCancel?: boolean;
  onCancelled?: () => void;
};

export function PurchaseDetailDialog({
  purchaseId,
  open,
  onOpenChange,
  canCancel = false,
  onCancelled,
}: PurchaseDetailDialogProps) {
  const { selectedOrganizationId } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['purchases', 'detail', selectedOrganizationId, purchaseId],
    queryFn: () => purchasesApi.getById(purchaseId!),
    enabled: Boolean(open && purchaseId && selectedOrganizationId),
  });

  const purchase = detailQuery.data;
  const totalCost = purchase ? calculateItemsTotal(purchase.items) : 0;

  const handleCancel = async (reason: string) => {
    if (!purchase) {
      return;
    }
    setIsCancelling(true);
    try {
      await purchasesApi.cancel(purchase.id, { reason });
      await detailQuery.refetch();
      onCancelled?.();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="space-y-0 pr-10">
            <DialogTitle>Satın Alma Detayı</DialogTitle>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {detailQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(detailQuery.error, 'Satın alma detayı yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          {purchase ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <PurchaseStatusBadge status={purchase.status} />
                </div>
                {canCancel && isPurchaseActive(purchase.status) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <Ban className="mr-1 h-4 w-4" />
                    İptal Et
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Satın alma tarihi</p>
                  <p className="font-medium">{formatDateTime(purchase.purchasedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Şube</p>
                  <p className="font-medium">{purchase.branch.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tedarikçi</p>
                  <p className="font-medium">{purchase.supplier?.name ?? 'Tedarikçi Yok'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fatura numarası</p>
                  <p className="font-medium">
                    {purchase.invoiceNumber?.trim() ? purchase.invoiceNumber : '—'}
                  </p>
                </div>
                {purchase.cancelledAt ? (
                  <div>
                    <p className="text-muted-foreground">İptal tarihi</p>
                    <p className="font-medium">{formatDateTime(purchase.cancelledAt)}</p>
                  </div>
                ) : null}
                {purchase.cancellationReason ? (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">İptal nedeni</p>
                    <p className="font-medium">{purchase.cancellationReason}</p>
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Notlar</p>
                  <p className="font-medium">{purchase.notes?.trim() ? purchase.notes : '—'}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium">Kalemler</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Malzeme</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Toplam Fiyat</TableHead>
                      <TableHead>Birim Maliyet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">{item.ingredient.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatQuantityDisplay(item.quantity)}</TableCell>
                        <TableCell>{formatUnit(item.unit)}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end border-t pt-4">
                <p className="text-sm font-medium">
                  Toplam satın alma maliyeti: {formatCurrency(totalCost)}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <PurchaseCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        invoiceLabel={purchase?.invoiceNumber}
        isLoading={isCancelling}
        onConfirm={handleCancel}
      />
    </>
  );
}
