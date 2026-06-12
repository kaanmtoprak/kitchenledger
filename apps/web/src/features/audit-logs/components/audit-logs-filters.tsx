'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { TeamMember } from '@/features/team/types/team.types';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_TYPE_OPTIONS,
  formatAuditAction,
  formatAuditEntityType,
} from '@/lib/audit/audit-labels';

export type AuditLogsFilterState = {
  search: string;
  action: string;
  entityType: string;
  actorUserId: string;
  branchId: string;
  from: string;
  to: string;
};

type AuditLogsFiltersProps = {
  filters: AuditLogsFilterState;
  onChange: (filters: AuditLogsFilterState) => void;
  branches: Branch[];
  teamMembers: TeamMember[];
};

const ALL_VALUE = '__all__';

export function AuditLogsFilters({
  filters,
  onChange,
  branches,
  teamMembers,
}: AuditLogsFiltersProps) {
  const update = (patch: Partial<AuditLogsFilterState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Input
        placeholder="Ara (e-posta, kayıt, tür...)"
        value={filters.search}
        onChange={(event) => update({ search: event.target.value })}
      />

      <Select
        value={filters.action || ALL_VALUE}
        onValueChange={(value) =>
          update({ action: value === ALL_VALUE ? '' : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="İşlem tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm işlemler</SelectItem>
          {AUDIT_ACTION_OPTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {formatAuditAction(action)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.entityType || ALL_VALUE}
        onValueChange={(value) =>
          update({ entityType: value === ALL_VALUE ? '' : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Kayıt türü" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm kayıt türleri</SelectItem>
          {AUDIT_ENTITY_TYPE_OPTIONS.map((entityType) => (
            <SelectItem key={entityType} value={entityType}>
              {formatAuditEntityType(entityType)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.actorUserId || ALL_VALUE}
        onValueChange={(value) =>
          update({ actorUserId: value === ALL_VALUE ? '' : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Kullanıcı" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm kullanıcılar</SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.branchId || ALL_VALUE}
        onValueChange={(value) =>
          update({ branchId: value === ALL_VALUE ? '' : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Şube" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm şubeler</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={filters.from}
          onChange={(event) => update({ from: event.target.value })}
          aria-label="Başlangıç tarihi"
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(event) => update({ to: event.target.value })}
          aria-label="Bitiş tarihi"
        />
      </div>
    </div>
  );
}
