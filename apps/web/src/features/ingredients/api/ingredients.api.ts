import { apiClient } from '@/lib/api/api-client';
import type {
  CreateIngredientPayload,
  Ingredient,
  IngredientsListResponse,
  ListIngredientsParams,
  UpdateIngredientPayload,
} from '../types/ingredient.types';

function buildQueryString(params?: ListIngredientsParams): string {
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
  if (params.baseUnit) {
    search.set('baseUnit', params.baseUnit);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const ingredientsApi = {
  list: (params?: ListIngredientsParams) =>
    apiClient.get<IngredientsListResponse>(`/ingredients${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<Ingredient>(`/ingredients/${id}`),

  create: (payload: CreateIngredientPayload) => apiClient.post<Ingredient>('/ingredients', payload),

  update: (id: string, payload: UpdateIngredientPayload) =>
    apiClient.patch<Ingredient>(`/ingredients/${id}`, payload),

  deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/ingredients/${id}`),
};
