import { apiClient } from '@/lib/api/api-client';
import type {
  CreatePurchasePayload,
  ListPurchasesParams,
  PurchaseDetail,
  PurchasesListResponse,
} from '../types/purchase.types';

function buildQueryString(params?: ListPurchasesParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();

  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.branchId) search.set('branchId', params.branchId);
  if (params.supplierId) search.set('supplierId', params.supplierId);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.q) search.set('q', params.q);
  if (params.includeItems) search.set('includeItems', 'true');

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const purchasesApi = {
  list: (params?: ListPurchasesParams) =>
    apiClient.get<PurchasesListResponse>(`/purchases${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<PurchaseDetail>(`/purchases/${id}`),

  create: (payload: CreatePurchasePayload) => apiClient.post<PurchaseDetail>('/purchases', payload),
};
