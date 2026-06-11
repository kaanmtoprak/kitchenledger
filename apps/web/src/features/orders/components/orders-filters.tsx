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
import { ORDER_STATUS_OPTIONS, formatOrderStatus } from '@/lib/utils/display';
import type { OrderStatus } from '../types/order.types';

export type OrdersFilterState = {
  search: string;
  branchId?: string;
  status?: OrderStatus;
  from: string;
  to: string;
};

type OrdersFiltersProps = {
  filters: OrdersFilterState;
  branches: Branch[];
  isBranchesLoading?: boolean;
  onChange: (filters: OrdersFilterState) => void;
};

export function OrdersFilters({
  filters,
  branches,
  isBranchesLoading,
  onChange,
}: OrdersFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Müşteri, telefon veya sipariş no ara"
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
          <Label className="mb-2 block text-xs text-muted-foreground">Durum</Label>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              onChange({
                ...filters,
                status: value === 'all' ? undefined : (value as OrderStatus),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatOrderStatus(status)}
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
