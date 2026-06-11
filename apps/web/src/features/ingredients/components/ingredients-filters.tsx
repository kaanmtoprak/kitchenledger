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
import { BASE_UNIT_OPTIONS } from '../schemas/ingredient.schemas';
import type { BaseUnit } from '../types/ingredient.types';
import { formatBaseUnit } from '@/lib/utils/display';

export type IngredientsFilterState = {
  search: string;
  includeInactive: boolean;
  baseUnit: BaseUnit | 'all';
};

type IngredientsFiltersProps = {
  filters: IngredientsFilterState;
  onChange: (filters: IngredientsFilterState) => void;
};

export function IngredientsFilters({ filters, onChange }: IngredientsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Ada veya malzeme koduna göre ara..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-[180px]">
          <Label className="mb-2 block text-xs text-muted-foreground">Temel birim</Label>
          <Select
            value={filters.baseUnit}
            onValueChange={(value) => onChange({ ...filters, baseUnit: value as BaseUnit | 'all' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm birimler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm birimler</SelectItem>
              {BASE_UNIT_OPTIONS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {formatBaseUnit(unit)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
}
