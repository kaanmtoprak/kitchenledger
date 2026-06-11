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
import type { Branch } from '@/features/branches/types/branch.types';
import type { Ingredient } from '@/features/ingredients/types/ingredient.types';
import type { InventoryTab, StockMovementType } from '../types/inventory.types';
import { formatMovementType } from '@/lib/utils/display';

const movementTypes: StockMovementType[] = [
  'PURCHASE',
  'PRODUCTION_CONSUMPTION',
  'MANUAL_ADJUSTMENT',
  'WASTE',
  'RETURN',
];

export type StockFilterState = {
  search: string;
  lowStockOnly: boolean;
};

export type BatchesFilterState = {
  onlyAvailable: boolean;
  ingredientId?: string;
};

export type MovementsFilterState = {
  type: StockMovementType | 'all';
  ingredientId?: string;
  from: string;
  to: string;
};

type InventoryFiltersProps = {
  activeTab: InventoryTab;
  branchId?: string;
  branches: Branch[];
  ingredients: Ingredient[];
  stockFilters: StockFilterState;
  batchesFilters: BatchesFilterState;
  movementsFilters: MovementsFilterState;
  onBranchChange: (branchId?: string) => void;
  onStockFiltersChange: (filters: StockFilterState) => void;
  onBatchesFiltersChange: (filters: BatchesFilterState) => void;
  onMovementsFiltersChange: (filters: MovementsFilterState) => void;
};

export function InventoryFilters({
  activeTab,
  branchId,
  branches,
  ingredients,
  stockFilters,
  batchesFilters,
  movementsFilters,
  onBranchChange,
  onStockFiltersChange,
  onBatchesFiltersChange,
  onMovementsFiltersChange,
}: InventoryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Şube</Label>
          <Select
            value={branchId ?? 'all'}
            onValueChange={(value) => onBranchChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm Şubeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şubeler</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={stockFilters.search}
              onChange={(event) =>
                onStockFiltersChange({ ...stockFilters, search: event.target.value })
              }
              placeholder="Malzeme ara..."
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={stockFilters.lowStockOnly}
              onChange={(event) =>
                onStockFiltersChange({ ...stockFilters, lowStockOnly: event.target.checked })
              }
              className="h-4 w-4 rounded border border-input"
            />
            Yalnızca düşük stok
          </label>
        </div>
      ) : null}

      {activeTab === 'batches' ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-xs">
            <Label className="mb-2 block text-xs text-muted-foreground">Malzeme</Label>
            <Select
              value={batchesFilters.ingredientId ?? 'all'}
              onValueChange={(value) =>
                onBatchesFiltersChange({
                  ...batchesFilters,
                  ingredientId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm malzemeler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm malzemeler</SelectItem>
                {ingredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={batchesFilters.onlyAvailable}
              onChange={(event) =>
                onBatchesFiltersChange({
                  ...batchesFilters,
                  onlyAvailable: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border border-input"
            />
            Yalnızca mevcut
          </label>
        </div>
      ) : null}

      {activeTab === 'movements' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Hareket türü</Label>
            <Select
              value={movementsFilters.type}
              onValueChange={(value) =>
                onMovementsFiltersChange({
                  ...movementsFilters,
                  type: value as StockMovementType | 'all',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm türler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm türler</SelectItem>
                {movementTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatMovementType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Malzeme</Label>
            <Select
              value={movementsFilters.ingredientId ?? 'all'}
              onValueChange={(value) =>
                onMovementsFiltersChange({
                  ...movementsFilters,
                  ingredientId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm malzemeler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm malzemeler</SelectItem>
                {ingredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Başlangıç</Label>
            <Input
              type="date"
              value={movementsFilters.from}
              onChange={(event) =>
                onMovementsFiltersChange({ ...movementsFilters, from: event.target.value })
              }
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Bitiş</Label>
            <Input
              type="date"
              value={movementsFilters.to}
              onChange={(event) =>
                onMovementsFiltersChange({ ...movementsFilters, to: event.target.value })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
