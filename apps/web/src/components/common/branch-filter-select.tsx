'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import { NO_ACCESSIBLE_BRANCHES_MESSAGE } from '@/lib/branches/accessible-branches';

type BranchFilterSelectProps = {
  value?: string;
  branches: Branch[];
  isLoading?: boolean;
  onChange: (branchId?: string) => void;
  label?: string;
  allLabel?: string;
};

export function BranchFilterSelect({
  value,
  branches,
  isLoading,
  onChange,
  label = 'Şube',
  allLabel = 'Tüm Şubeler',
}: BranchFilterSelectProps) {
  const isDisabled = isLoading || branches.length === 0;
  const placeholder = branches.length === 0 ? NO_ACCESSIBLE_BRANCHES_MESSAGE : allLabel;

  return (
    <div>
      <Label className="mb-2 block text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value ?? 'all'}
        onValueChange={(nextValue) => onChange(nextValue === 'all' ? undefined : nextValue)}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {branches.length > 0 ? <SelectItem value="all">{allLabel}</SelectItem> : null}
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
