import type { PaginatedResponse } from '@/features/branches/types/branch.types';

export type AuditLogBranch = {
  id: string;
  name: string;
  code: string;
};

export type AuditLog = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  branch: AuditLogBranch | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  summary: string;
};

export type ListAuditLogsParams = {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  actorUserId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  search?: string;
};

export type ListAuditLogsResponse = PaginatedResponse<AuditLog>;
