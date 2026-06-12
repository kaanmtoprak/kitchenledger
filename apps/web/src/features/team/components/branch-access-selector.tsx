'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  hasOrgWideBranchAccess,
  requiresBranchSelection,
} from '@/lib/auth/role-labels';
import type { Branch } from '@/features/branches/types/branch.types';

type BranchAccessSelectorProps = {
  role: string;
  branches: Branch[];
  value: string[];
  onChange: (branchIds: string[]) => void;
  disabled?: boolean;
};

export function BranchAccessSelector({
  role,
  branches,
  value,
  onChange,
  disabled = false,
}: BranchAccessSelectorProps) {
  if (hasOrgWideBranchAccess(role)) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-muted-foreground">
        Bu rol tüm şubelere erişebilir. İsterseniz belirli şubeler de seçebilirsiniz.
      </p>
    );
  }

  const toggleBranch = (branchId: string) => {
    if (disabled) {
      return;
    }

    if (value.includes(branchId)) {
      onChange(value.filter((id) => id !== branchId));
      return;
    }

    onChange([...value, branchId]);
  };

  return (
    <div className="space-y-2">
      {requiresBranchSelection(role) ? (
        <p className="text-xs text-muted-foreground">En az bir şube seçilmelidir.</p>
      ) : null}
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aktif şube bulunamadı.</p>
        ) : (
          branches.map((branch) => {
            const checked = value.includes(branch.id);

            return (
              <label
                key={branch.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
                  checked
                    ? 'border-blue-200 bg-blue-50/60'
                    : 'border-transparent hover:bg-slate-50',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleBranch(branch.id)}
                />
                <span className="flex-1">
                  <Label className="font-medium text-foreground">{branch.name}</Label>
                  <span className="ml-2 text-xs text-muted-foreground">{branch.code}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
