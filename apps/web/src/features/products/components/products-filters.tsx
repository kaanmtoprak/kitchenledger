'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type ProductsFilterState = {
  search: string;
  includeInactive: boolean;
};

type ProductsFiltersProps = {
  filters: ProductsFilterState;
  onChange: (filters: ProductsFilterState) => void;
};

export function ProductsFilters({ filters, onChange }: ProductsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Ürün ara..."
          className="pl-9"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.includeInactive}
          onChange={(event) => onChange({ ...filters, includeInactive: event.target.checked })}
          className="h-4 w-4 rounded border border-input"
        />
        Pasifleri dahil et
      </label>
    </div>
  );
}
