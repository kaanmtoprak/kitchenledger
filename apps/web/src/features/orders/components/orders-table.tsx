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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/display';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStatusSelect } from './order-status-select';
import type { OrderListItem, OrderStatus } from '../types/order.types';

type OrdersTableProps = {
  orders: OrderListItem[];
  branchNameById: Record<string, string>;
  isLoading?: boolean;
  canCreate?: boolean;
  canUpdateStatus?: boolean;
  onView: (order: OrderListItem) => void;
  onCreate?: () => void;
  onStatusChange?: (order: OrderListItem, status: OrderStatus) => void;
  updatingOrderId?: string | null;
};

export function OrdersTable({
  orders,
  branchNameById,
  isLoading,
  canCreate = true,
  canUpdateStatus = false,
  onView,
  onCreate,
  onStatusChange,
  updatingOrderId,
}: OrdersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canCreate, 'Henüz sipariş yok')}
        description={
          canCreate
            ? 'Müşteri siparişlerini kaydetmeye başladığınızda ürün bazlı satış ve teslimat takibini buradan yapabilirsiniz.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canCreate ? (
            <Button type="button" onClick={onCreate}>
              Yeni Sipariş
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
            <TableHead>Sipariş No</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Şube</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Kalem</TableHead>
            <TableHead className="text-right">Toplam Tutar</TableHead>
            <TableHead>Teslim Tarihi</TableHead>
            <TableHead className="w-12 text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium whitespace-nowrap">{order.orderNumber}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(order.orderedAt)}</TableCell>
              <TableCell className="max-w-[160px] truncate">
                {order.customer?.name ?? '—'}
              </TableCell>
              <TableCell className="max-w-[140px] truncate">
                {branchNameById[order.branchId] ?? order.branchId}
              </TableCell>
              <TableCell>
                {canUpdateStatus && onStatusChange ? (
                  <OrderStatusSelect
                    value={order.status}
                    onChange={(status) => onStatusChange(order, status)}
                    disabled={updatingOrderId === order.id}
                    className="h-8 w-[150px]"
                  />
                ) : (
                  <OrderStatusBadge status={order.status} />
                )}
              </TableCell>
              <TableCell className="text-right">{order.itemCount ?? '—'}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatCurrency(order.totalAmount)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {order.dueAt ? formatDate(order.dueAt) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(order)}
                  aria-label="Sipariş detayını görüntüle"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
