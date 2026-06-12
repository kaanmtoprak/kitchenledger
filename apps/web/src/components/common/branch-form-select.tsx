'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch } from '@/features/branches/types/branch.types';
import { NO_ACCESSIBLE_BRANCHES_MESSAGE } from '@/lib/branches/accessible-branches';

type BranchFormSelectProps = {
  value: string;
  branches: Branch[];
  isLoading?: boolean;
  onChange: (branchId: string) => void;
  placeholder?: string;
};

export function BranchFormSelect({
  value,
  branches,
  isLoading,
  onChange,
  placeholder = 'Şube seçin',
}: BranchFormSelectProps) {
  const isDisabled = isLoading || branches.length === 0;
  const resolvedPlaceholder = branches.length === 0 ? NO_ACCESSIBLE_BRANCHES_MESSAGE : placeholder;

  return (
    <Select value={value} onValueChange={onChange} disabled={isDisabled}>
      <SelectTrigger>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
