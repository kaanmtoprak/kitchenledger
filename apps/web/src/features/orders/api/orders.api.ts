import { apiClient } from '@/lib/api/api-client';
import type {
  CreateOrderPayload,
  ListOrdersParams,
  OrderDetail,
  OrdersListResponse,
  UpdateOrderStatusPayload,
} from '../types/order.types';

function buildQueryString(params?: ListOrdersParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();

  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.q) search.set('q', params.q);
  if (params.branchId) search.set('branchId', params.branchId);
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.includeItems) search.set('includeItems', 'true');

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const ordersApi = {
  list: (params?: ListOrdersParams) =>
    apiClient.get<OrdersListResponse>(`/orders${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<OrderDetail>(`/orders/${id}`),

  create: (payload: CreateOrderPayload) => apiClient.post<OrderDetail>('/orders', payload),

  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    apiClient.patch<OrderDetail>(`/orders/${id}/status`, payload),
};
