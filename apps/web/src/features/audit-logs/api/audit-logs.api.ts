import { apiClient } from '@/lib/api/api-client';
import type { ListAuditLogsParams, ListAuditLogsResponse } from '../types/audit-log.types';

function buildQueryString(params?: ListAuditLogsParams): string {
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
  if (params.action) {
    search.set('action', params.action);
  }
  if (params.entityType) {
    search.set('entityType', params.entityType);
  }
  if (params.actorUserId) {
    search.set('actorUserId', params.actorUserId);
  }
  if (params.branchId) {
    search.set('branchId', params.branchId);
  }
  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }
  if (params.search) {
    search.set('search', params.search);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const auditLogsApi = {
  list: (params?: ListAuditLogsParams) =>
    apiClient.get<ListAuditLogsResponse>(`/audit-logs${buildQueryString(params)}`),
};
