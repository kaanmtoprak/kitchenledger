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
import { CostExplanation } from '@/components/common/cost-explanation';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import {
  formatBaseUnit,
  formatCurrency,
  formatDate,
  formatQuantityDisplay,
} from '@/lib/utils/display';
import { productionsApi } from '../api/productions.api';
import { formatShortId } from '../types/production.types';

type ProductionDetailDialogProps = {
  productionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductionDetailDialog({
  productionId,
  open,
  onOpenChange,
}: ProductionDetailDialogProps) {
  const { selectedOrganizationId } = useAuth();

  const detailQuery = useQuery({
    queryKey: ['productions', 'detail', selectedOrganizationId, productionId],
    queryFn: () => productionsApi.getById(productionId!),
    enabled: Boolean(open && productionId && selectedOrganizationId),
  });

  const production = detailQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Üretim Detayı</DialogTitle>
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
              {getApiErrorMessage(detailQuery.error, 'Üretim detayı yüklenemedi.')}
            </AlertDescription>
          </Alert>
        ) : null}

        {production ? (
          <div className="space-y-6">
            <CostExplanation variant="production" />

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Ürün</p>
                <p className="font-medium">
                  {production.product.name} ({production.product.sku})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Şube</p>
                <p className="font-medium">{production.branch.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Üretilen miktar</p>
                <p className="font-medium">{formatQuantityDisplay(production.quantityProduced)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Üretim tarihi</p>
                <p className="font-medium">{formatDate(production.producedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Toplam maliyet anlık görüntüsü</p>
                <p className="font-medium">{formatCurrency(production.totalCostSnapshot)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Birim maliyet anlık görüntüsü</p>
                <p className="font-medium">{formatCurrency(production.unitCostSnapshot)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reçete</p>
                <p className="font-medium">
                  {production.recipe.name} —{' '}
                  {formatQuantityDisplay(production.recipe.yieldQuantity)}{' '}
                  {formatBaseUnit(production.recipe.yieldUnit)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Notlar</p>
                <p className="font-medium">{production.notes?.trim() ? production.notes : '—'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">FIFO tüketimi</h3>

              {production.consumptions.length === 0 ? (
                <Alert>
                  <AlertDescription>Bu yanıtta tüketim hareketleri bulunmuyor.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {production.consumptions.map((consumption) => (
                    <div key={consumption.ingredientId} className="rounded-lg border p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{consumption.ingredientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatQuantityDisplay(consumption.quantity)}{' '}
                            {formatBaseUnit(consumption.unit)} — {formatCurrency(consumption.cost)}
                          </p>
                        </div>
                      </div>

                      {consumption.batches.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Parti</TableHead>
                                <TableHead className="text-right">Tüketilen Miktar</TableHead>
                                <TableHead className="text-right">Birim Maliyet</TableHead>
                                <TableHead className="text-right">Maliyet</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {consumption.batches.map((batch, index) => (
                                <TableRow
                                  key={`${consumption.ingredientId}-${batch.movementId ?? index}`}
                                >
                                  <TableCell>{formatShortId(batch.stockBatchId)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatQuantityDisplay(batch.consumedQuantity)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(batch.unitCost)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(batch.cost)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
