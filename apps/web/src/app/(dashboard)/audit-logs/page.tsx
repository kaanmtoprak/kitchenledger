'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { TablePagination } from '@/components/common/table-pagination';
import { auditLogsApi } from '@/features/audit-logs/api/audit-logs.api';
import { AuditLogDetailDialog } from '@/features/audit-logs/components/audit-log-detail-dialog';
import {
  AuditLogsFilters,
  type AuditLogsFilterState,
} from '@/features/audit-logs/components/audit-logs-filters';
import { AuditLogsTable } from '@/features/audit-logs/components/audit-logs-table';
import type { AuditLog } from '@/features/audit-logs/types/audit-log.types';
import { branchesApi } from '@/features/branches/api/branches.api';
import { teamApi } from '@/features/team/api/team.api';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

const PAGE_LIMIT = 20;

export default function AuditLogsPage() {
  const { selectedOrganizationId } = useAuth();
  const permissions = usePermissions();

  const [filters, setFilters] = useState<AuditLogsFilterState>({
    search: '',
    action: '',
    entityType: '',
    actorUserId: '',
    branchId: '',
    from: '',
    to: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const filterKey = `${selectedOrganizationId}:${debouncedSearch}:${filters.action}:${filters.entityType}:${filters.actorUserId}:${filters.branchId}:${filters.from}:${filters.to}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const setPage = (nextPage: number) => {
    setPagination({ filterKey, page: nextPage });
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: debouncedSearch || undefined,
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
      actorUserId: filters.actorUserId || undefined,
      branchId: filters.branchId || undefined,
      from: filters.from ? new Date(filters.from).toISOString() : undefined,
      to: filters.to
        ? new Date(`${filters.to}T23:59:59.999`).toISOString()
        : undefined,
    }),
    [
      page,
      debouncedSearch,
      filters.action,
      filters.entityType,
      filters.actorUserId,
      filters.branchId,
      filters.from,
      filters.to,
    ],
  );

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', selectedOrganizationId, queryParams],
    queryFn: () => auditLogsApi.list(queryParams),
    enabled: Boolean(selectedOrganizationId) && permissions.canViewAuditLogs,
  });

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, 'audit-logs'],
    queryFn: () => branchesApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId) && permissions.canViewAuditLogs,
  });

  const teamQuery = useQuery({
    queryKey: ['team', selectedOrganizationId, 'audit-logs-filters'],
    queryFn: () => teamApi.list(),
    enabled: Boolean(selectedOrganizationId) && permissions.canViewAuditLogs,
  });

  if (!permissions.canViewAuditLogs) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="İşlem Kayıtları"
          description="Organizasyon içinde yapılan kritik oluşturma, güncelleme, durum ve stok işlemlerini takip edin."
        />
        <Alert>
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="İşlem Kayıtları"
        description="Organizasyon içinde yapılan kritik oluşturma, güncelleme, durum ve stok işlemlerini takip edin."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <AuditLogsFilters
            filters={filters}
            onChange={setFilters}
            branches={branchesQuery.data?.data ?? []}
            teamMembers={teamQuery.data ?? []}
          />

          {auditLogsQuery.error ? (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(auditLogsQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          <AuditLogsTable
            logs={auditLogsQuery.data?.data ?? []}
            isLoading={auditLogsQuery.isLoading}
            onViewDetail={setSelectedLog}
          />

          <TablePagination meta={auditLogsQuery.data?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      <AuditLogDetailDialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
        log={selectedLog}
      />
    </div>
  );
}
