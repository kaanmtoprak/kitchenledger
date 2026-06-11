'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Branch } from '@/features/branches/types/branch.types';
import type { DashboardDateRangePreset, DashboardFilters } from '../types/dashboard.types';
import { NO_ACCESSIBLE_BRANCHES_MESSAGE } from '@/lib/branches/accessible-branches';
import { cn } from '@/lib/utils';

const presetOptions: { value: DashboardDateRangePreset; label: string }[] = [
  { value: '7d', label: 'Son 7 gün' },
  { value: '30d', label: 'Son 30 gün' },
  { value: '90d', label: 'Son 90 gün' },
];

type DashboardFiltersProps = {
  filters: DashboardFilters;
  branches: Branch[];
  isBranchesLoading?: boolean;
  onChange: (filters: DashboardFilters) => void;
};

export function DashboardFiltersBar({
  filters,
  branches,
  isBranchesLoading,
  onChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filters.preset === option.value ? 'default' : 'outline'}
            onClick={() => onChange({ ...filters, preset: option.value })}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className={cn('w-full sm:w-[220px]')}>
        <Select
          value={filters.branchId ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              branchId: value === 'all' ? undefined : value,
            })
          }
          disabled={isBranchesLoading || branches.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                branches.length === 0 ? NO_ACCESSIBLE_BRANCHES_MESSAGE : 'Tüm Şubeler'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {branches.length > 0 ? <SelectItem value="all">Tüm Şubeler</SelectItem> : null}
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
