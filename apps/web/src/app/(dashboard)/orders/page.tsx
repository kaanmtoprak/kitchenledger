'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { SuccessAlert } from '@/components/common/success-alert';
import { TablePagination } from '@/components/common/table-pagination';
import { ordersApi } from '@/features/orders/api/orders.api';
import { OrderDetailDialog } from '@/features/orders/components/order-detail-dialog';
import { OrderFormDialog } from '@/features/orders/components/order-form-dialog';
import {
  OrdersFilters,
  type OrdersFilterState,
} from '@/features/orders/components/orders-filters';
import { OrdersTable } from '@/features/orders/components/orders-table';
import type { OrderFormValues } from '@/features/orders/schemas/order.schemas';
import type { OrderListItem, OrderStatus } from '@/features/orders/types/order.types';
import { productsApi } from '@/features/products/api/products.api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

function toStartOfDayIso(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function optionalField(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrdersFilterState>({
    search: '',
    from: '',
    to: '',
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.branchId ?? ''}:${filters.status ?? ''}:${filters.from}:${filters.to}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const setPage = (nextPage: number) => {
    setPagination({ filterKey, page: nextPage });
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      q: debouncedSearch || undefined,
      branchId: filters.branchId,
      status: filters.status,
      from: filters.from ? toStartOfDayIso(filters.from) : undefined,
      to: filters.to ? toEndOfDayIso(filters.to) : undefined,
    }),
    [page, debouncedSearch, filters.branchId, filters.status, filters.from, filters.to],
  );

  const ordersQuery = useQuery({
    queryKey: ['orders', selectedOrganizationId, queryParams],
    queryFn: () => ordersApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId),
  });

  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'orders' });

  const productsQuery = useQuery({
    queryKey: ['products', selectedOrganizationId, 'orders-form'],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSuccessMessage('Sipariş durumu güncellendi.');
    },
  });

  const branchNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const branch of branches) {
      map[branch.id] = branch.name;
    }
    return map;
  }, [branches]);

  const handleCreateSubmit = async (values: OrderFormValues) => {
    setSuccessMessage(null);
    await createMutation.mutateAsync({
      branchId: values.branchId,
      customer: {
        name: values.customerName.trim(),
        phone: optionalField(values.customerPhone),
        email: optionalField(values.customerEmail),
      },
      orderedAt: values.orderedAt ? new Date(values.orderedAt).toISOString() : undefined,
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      notes: optionalField(values.notes),
      items: values.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity.trim(),
        unitPrice: item.unitPrice.trim(),
      })),
    });
    setSuccessMessage('Sipariş oluşturuldu.');
  };

  const handleViewOrder = (order: OrderListItem) => {
    setDetailOrderId(order.id);
    setDetailDialogOpen(true);
  };

  const handleStatusChange = async (order: OrderListItem, status: OrderStatus) => {
    if (status === order.status) {
      return;
    }
    setSuccessMessage(null);
    setStatusError(null);
    setUpdatingOrderId(order.id);
    try {
      await statusMutation.mutateAsync({ id: order.id, status });
    } catch (error) {
      setStatusError(getApiErrorMessage(error, 'Sipariş durumu güncellenemedi.'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siparişler"
        description="Müşteri siparişlerini, ürün kalemlerini ve sipariş durumlarını şube bazlı takip edin."
        action={
          permissions.canCreateOrder ? (
            <Button type="button" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Yeni Sipariş
            </Button>
          ) : undefined
        }
      />

      {successMessage ? (
        <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      {statusError ? (
        <Alert variant="destructive">
          <AlertDescription>{statusError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <OrdersFilters
            filters={filters}
            branches={branches}
            isBranchesLoading={branchesQuery.isLoading}
            onChange={setFilters}
          />

          {ordersQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(ordersQuery.error, 'Siparişler yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <OrdersTable
            orders={ordersQuery.data?.data ?? []}
            branchNameById={branchNameById}
            isLoading={ordersQuery.isLoading}
            canCreate={permissions.canCreateOrder}
            canUpdateStatus={permissions.canUpdateOrderStatus}
            onView={handleViewOrder}
            onCreate={permissions.canCreateOrder ? () => setCreateDialogOpen(true) : undefined}
            onStatusChange={
              permissions.canUpdateOrderStatus ? handleStatusChange : undefined
            }
            updatingOrderId={updatingOrderId}
          />

          <TablePagination meta={ordersQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      {permissions.canCreateOrder ? (
        <OrderFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          branches={branches}
          products={productsQuery.data?.data ?? []}
          onSubmit={handleCreateSubmit}
        />
      ) : null}

      <OrderDetailDialog
        orderId={detailOrderId}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailOrderId(null);
          }
        }}
        canUpdateStatus={permissions.canUpdateOrderStatus}
        onStatusUpdated={() => setSuccessMessage('Sipariş durumu güncellendi.')}
      />
    </div>
  );
}
