import { apiClient } from '@/lib/api/api-client';
import type {
  CreateSupplierPayload,
  ListSuppliersParams,
  Supplier,
  SuppliersListResponse,
  UpdateSupplierPayload,
} from '../types/supplier.types';

function buildQueryString(params?: ListSuppliersParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();

  if (params.page !== undefined) {
    search.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit));
  }
  if (params.q) {
    search.set('q', params.q);
  }
  if (params.includeInactive) {
    search.set('includeInactive', 'true');
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const suppliersApi = {
  list: (params?: ListSuppliersParams) =>
    apiClient.get<SuppliersListResponse>(`/suppliers${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<Supplier>(`/suppliers/${id}`),

  create: (payload: CreateSupplierPayload) => apiClient.post<Supplier>('/suppliers', payload),

  update: (id: string, payload: UpdateSupplierPayload) =>
    apiClient.patch<Supplier>(`/suppliers/${id}`, payload),

  deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/suppliers/${id}`),
};
