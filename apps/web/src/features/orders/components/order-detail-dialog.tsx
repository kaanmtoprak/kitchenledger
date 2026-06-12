'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { formatCurrency, formatDateTime, formatQuantityDisplay } from '@/lib/utils/display';
import { ordersApi } from '../api/orders.api';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStatusSelect } from './order-status-select';
import type { OrderStatus } from '../types/order.types';

type OrderDetailDialogProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdateStatus?: boolean;
  onStatusUpdated?: () => void;
};

export function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
  canUpdateStatus = false,
  onStatusUpdated,
}: OrderDetailDialogProps) {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const [statusError, setStatusError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['orders', 'detail', selectedOrganizationId, orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: Boolean(open && orderId && selectedOrganizationId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusError(null);
      onStatusUpdated?.();
    },
    onError: (error) => {
      setStatusError(getApiErrorMessage(error, 'Sipariş durumu güncellenemedi.'));
    },
  });

  const order = detailQuery.data;

  const handleStatusChange = (status: OrderStatus) => {
    if (!order || status === order.status) {
      return;
    }
    statusMutation.mutate({ id: order.id, status });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setStatusError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sipariş Detayı</DialogTitle>
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
              {getApiErrorMessage(detailQuery.error, 'Sipariş detayı yüklenemedi.')}
            </AlertDescription>
          </Alert>
        ) : null}

        {order ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sipariş no</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
              {canUpdateStatus ? (
                <div className="w-full max-w-[200px] space-y-2">
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <OrderStatusSelect
                    value={order.status}
                    onChange={handleStatusChange}
                    disabled={statusMutation.isPending}
                  />
                </div>
              ) : (
                <OrderStatusBadge status={order.status} />
              )}
            </div>

            {statusError ? (
              <Alert variant="destructive">
                <AlertDescription>{statusError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Müşteri</p>
                <p className="font-medium">{order.customer?.name ?? '—'}</p>
                {order.customer?.phone ? (
                  <p className="text-muted-foreground">{order.customer.phone}</p>
                ) : null}
                {order.customer?.email ? (
                  <p className="text-muted-foreground">{order.customer.email}</p>
                ) : null}
              </div>
              <div>
                <p className="text-muted-foreground">Şube</p>
                <p className="font-medium">{order.branch.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sipariş tarihi</p>
                <p className="font-medium">{formatDateTime(order.orderedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teslim tarihi</p>
                <p className="font-medium">{order.dueAt ? formatDateTime(order.dueAt) : '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Notlar</p>
                <p className="font-medium">{order.notes?.trim() ? order.notes : '—'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Kalemler</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Ürün Kodu</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Birim fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-[160px] truncate font-medium">
                          {item.product?.name ?? item.productId}
                        </TableCell>
                        <TableCell>{item.product?.sku ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {formatQuantityDisplay(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end rounded-lg border bg-muted p-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Genel toplam: </span>
                <span className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</span>
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
