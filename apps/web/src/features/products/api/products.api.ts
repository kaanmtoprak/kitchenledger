import { apiClient } from '@/lib/api/api-client';
import type {
  CreateProductPayload,
  ListProductsParams,
  Product,
  ProductCostParams,
  ProductCostResponse,
  ProductDetail,
  ProductsListResponse,
  UpdateProductPayload,
} from '../types/product.types';

function buildQueryString(params?: ListProductsParams): string {
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

function buildCostQueryString(params: ProductCostParams): string {
  const search = new URLSearchParams();
  search.set('branchId', params.branchId);
  return `?${search.toString()}`;
}

export const productsApi = {
  list: (params?: ListProductsParams) =>
    apiClient.get<ProductsListResponse>(`/products${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<ProductDetail>(`/products/${id}`),

  create: (payload: CreateProductPayload) => apiClient.post<Product>('/products', payload),

  update: (id: string, payload: UpdateProductPayload) =>
    apiClient.patch<Product>(`/products/${id}`, payload),

  deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/products/${id}`),

  getCost: (id: string, params: ProductCostParams) =>
    apiClient.get<ProductCostResponse>(`/products/${id}/cost${buildCostQueryString(params)}`),
};
