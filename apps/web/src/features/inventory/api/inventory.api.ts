import { apiClient } from '@/lib/api/api-client';
import type {
  CreateStockAdjustmentPayload,
  ListStockBatchesParams,
  ListStockMovementsParams,
  ListStockParams,
  StockAdjustmentResponse,
  StockBatchesListResponse,
  StockListResponse,
  StockMovementsListResponse,
} from '../types/inventory.types';

function appendBoolean(search: URLSearchParams, key: string, value?: boolean) {
  if (value) {
    search.set(key, 'true');
  }
}

function buildStockQuery(params?: ListStockParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.q) search.set('q', params.q);
  if (params.branchId) search.set('branchId', params.branchId);
  if (params.ingredientId) search.set('ingredientId', params.ingredientId);
  appendBoolean(search, 'lowStockOnly', params.lowStockOnly);

  const query = search.toString();
  return query ? `?${query}` : '';
}

function buildBatchesQuery(params?: ListStockBatchesParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.branchId) search.set('branchId', params.branchId);
  if (params.ingredientId) search.set('ingredientId', params.ingredientId);
  appendBoolean(search, 'onlyAvailable', params.onlyAvailable);

  const query = search.toString();
  return query ? `?${query}` : '';
}

function buildMovementsQuery(params?: ListStockMovementsParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.branchId) search.set('branchId', params.branchId);
  if (params.ingredientId) search.set('ingredientId', params.ingredientId);
  if (params.type) search.set('type', params.type);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const inventoryApi = {
  listStock: (params?: ListStockParams) =>
    apiClient.get<StockListResponse>(`/inventory/stock${buildStockQuery(params)}`),

  listBatches: (params?: ListStockBatchesParams) =>
    apiClient.get<StockBatchesListResponse>(`/inventory/batches${buildBatchesQuery(params)}`),

  listMovements: (params?: ListStockMovementsParams) =>
    apiClient.get<StockMovementsListResponse>(`/inventory/movements${buildMovementsQuery(params)}`),

  createAdjustment: (payload: CreateStockAdjustmentPayload) =>
    apiClient.post<StockAdjustmentResponse>('/inventory/adjustments', payload),
};
