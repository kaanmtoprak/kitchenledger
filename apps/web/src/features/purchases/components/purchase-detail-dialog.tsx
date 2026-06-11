'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { calculateItemsTotal } from '../types/purchase.types';

type PurchaseDetailDialogProps = {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PurchaseDetailDialog({
  purchaseId,
  open,
  onOpenChange,
}: PurchaseDetailDialogProps) {
  const { selectedOrganizationId } = useAuth();

  const detailQuery = useQuery({
    queryKey: ['purchases', 'detail', selectedOrganizationId, purchaseId],
    queryFn: () => purchasesApi.getById(purchaseId!),
    enabled: Boolean(open && purchaseId && selectedOrganizationId),
  });

  const purchase = detailQuery.data;
  const totalCost = purchase ? calculateItemsTotal(purchase.items) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
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
  );
}
