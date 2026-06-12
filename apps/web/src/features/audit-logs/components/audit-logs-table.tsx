'use client';

import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import { formatAuditAction, formatAuditEntityType } from '@/lib/audit/audit-labels';
import { formatDateTime } from '@/lib/utils/display';
import type { AuditLog } from '../types/audit-log.types';

type AuditLogsTableProps = {
  logs: AuditLog[];
  isLoading?: boolean;
  onViewDetail: (log: AuditLog) => void;
};

export function AuditLogsTable({ logs, isLoading, onViewDetail }: AuditLogsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="Henüz işlem kaydı yok"
        description="Kritik oluşturma, güncelleme veya stok işlemleri burada listelenir."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarih</TableHead>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>İşlem</TableHead>
          <TableHead>Kayıt Türü</TableHead>
          <TableHead>Kayıt</TableHead>
          <TableHead>Şube</TableHead>
          <TableHead>Özet</TableHead>
          <TableHead className="w-[90px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
            <TableCell>{log.actorEmail ?? '—'}</TableCell>
            <TableCell>
              <Badge variant="secondary">{formatAuditAction(log.action)}</Badge>
            </TableCell>
            <TableCell>{formatAuditEntityType(log.entityType)}</TableCell>
            <TableCell className="max-w-[180px] truncate">
              {log.entityLabel ?? log.entityId ?? '—'}
            </TableCell>
            <TableCell>{log.branch?.name ?? '—'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{log.summary}</TableCell>
            <TableCell className="text-right">
              <Button type="button" variant="ghost" size="sm" onClick={() => onViewDetail(log)}>
                <Eye className="mr-1 h-4 w-4" />
                Detay
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
