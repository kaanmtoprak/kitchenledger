'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchFilterSelect } from '@/components/common/branch-filter-select';
import type { Branch } from '@/features/branches/types/branch.types';
import type { Supplier } from '@/features/suppliers/types/supplier.types';

export type PurchasesFilterState = {
  search: string;
  branchId?: string;
  supplierId?: string;
  from: string;
  to: string;
};

type PurchasesFiltersProps = {
  filters: PurchasesFilterState;
  branches: Branch[];
  suppliers: Supplier[];
  isBranchesLoading?: boolean;
  onChange: (filters: PurchasesFilterState) => void;
};

export function PurchasesFilters({
  filters,
  branches,
  suppliers,
  isBranchesLoading,
  onChange,
}: PurchasesFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Fatura numarasına göre ara..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BranchFilterSelect
          value={filters.branchId}
          branches={branches}
          isLoading={isBranchesLoading}
          onChange={(branchId) => onChange({ ...filters, branchId })}
        />

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Tedarikçi</Label>
          <Select
            value={filters.supplierId ?? 'all'}
            onValueChange={(value) =>
              onChange({ ...filters, supplierId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm tedarikçiler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm tedarikçiler</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Başlangıç</Label>
          <Input
            type="date"
            value={filters.from}
            onChange={(event) => onChange({ ...filters, from: event.target.value })}
          />
        </div>

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Bitiş</Label>
          <Input
            type="date"
            value={filters.to}
            onChange={(event) => onChange({ ...filters, to: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
