import { AuditAction } from '@kitchenledger/db';
import { TenantContext } from '../common/types/tenant-context.type';

export type AuditLogParams = {
  organizationId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  branchId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

export function auditActorFromTenant(tenant: TenantContext) {
  return {
    organizationId: tenant.organizationId,
    actorUserId: tenant.userId,
  };
}
