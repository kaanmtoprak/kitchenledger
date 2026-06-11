import { apiClient } from '@/lib/api/api-client';
import type {
  Branch,
  CreateBranchPayload,
  ListBranchesParams,
  PaginatedResponse,
  UpdateBranchPayload,
} from '../types/branch.types';

function buildQueryString(params?: ListBranchesParams): string {
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

export const branchesApi = {
  list: (params?: ListBranchesParams) =>
    apiClient.get<PaginatedResponse<Branch>>(`/branches${buildQueryString(params)}`),

  getById: (id: string) => apiClient.get<Branch>(`/branches/${id}`),

  create: (payload: CreateBranchPayload) => apiClient.post<Branch>('/branches', payload),

  update: (id: string, payload: UpdateBranchPayload) =>
    apiClient.patch<Branch>(`/branches/${id}`, payload),

  deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/branches/${id}`),
};
