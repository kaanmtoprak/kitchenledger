import { apiClient } from '@/lib/api/api-client';
import type {
  CreateProductionPayload,
  ListProductionsParams,
  ProductionDetail,
  ProductionsListResponse,
} from '../types/production.types';

function buildQueryString(params?: ListProductionsParams): string {
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
  if (params.branchId) {
    search.set('branchId', params.branchId);
  }
  if (params.productId) {
    search.set('productId', params.productId);
  }
  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const productionsApi = {
  list: (params?: ListProductionsParams) =>
    apiClient.get<ProductionsListResponse>(`/productions${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<ProductionDetail>(`/productions/${id}`),

  create: (payload: CreateProductionPayload) =>
    apiClient.post<ProductionDetail>('/productions', payload),
};
