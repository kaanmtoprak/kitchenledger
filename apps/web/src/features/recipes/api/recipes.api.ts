import { apiClient } from '@/lib/api/api-client';
import type {
  CreateRecipePayload,
  ListRecipesParams,
  RecipeCostParams,
  RecipeCostResponse,
  RecipeDetail,
  RecipesListResponse,
  UpdateRecipePayload,
} from '../types/recipe.types';

function buildQueryString(params?: ListRecipesParams): string {
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
  if (params.productId) {
    search.set('productId', params.productId);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

function buildCostQueryString(params: RecipeCostParams): string {
  const search = new URLSearchParams();
  search.set('branchId', params.branchId);
  return `?${search.toString()}`;
}

export const recipesApi = {
  list: (params?: ListRecipesParams) =>
    apiClient.get<RecipesListResponse>(`/recipes${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<RecipeDetail>(`/recipes/${id}`),

  create: (payload: CreateRecipePayload) => apiClient.post<RecipeDetail>('/recipes', payload),

  update: (id: string, payload: UpdateRecipePayload) =>
    apiClient.patch<RecipeDetail>(`/recipes/${id}`, payload),

  getCost: (id: string, params: RecipeCostParams) =>
    apiClient.get<RecipeCostResponse>(`/recipes/${id}/cost${buildCostQueryString(params)}`),
};
