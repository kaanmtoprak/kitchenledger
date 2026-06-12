'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatAuditAction,
  formatAuditEntityType,
} from '@/lib/audit/audit-labels';
import { formatDateTime } from '@/lib/utils/display';
import type { AuditLog } from '../types/audit-log.types';

type AuditLogDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLog | null;
};

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <pre className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs leading-relaxed text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AuditLogDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) {
  if (!log) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>İşlem Detayı</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tarih
              </p>
              <p className="text-sm">{formatDateTime(log.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kullanıcı
              </p>
              <p className="text-sm">{log.actorEmail ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                İşlem
              </p>
              <Badge variant="secondary">{formatAuditAction(log.action)}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kayıt Türü
              </p>
              <p className="text-sm">{formatAuditEntityType(log.entityType)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kayıt
              </p>
              <p className="text-sm">{log.entityLabel ?? log.entityId ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Şube
              </p>
              <p className="text-sm">{log.branch?.name ?? '—'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Önceki Değer</p>
            <JsonBlock value={log.before} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Yeni Değer</p>
            <JsonBlock value={log.after} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Metadata</p>
            <JsonBlock value={log.metadata} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
