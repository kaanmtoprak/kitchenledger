'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/features/products/types/product.types';

export type RecipesFilterState = {
  search: string;
  productId?: string;
};

type RecipesFiltersProps = {
  filters: RecipesFilterState;
  products: Product[];
  onChange: (filters: RecipesFilterState) => void;
};

export function RecipesFilters({ filters, products, onChange }: RecipesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Reçete ara..."
          className="pl-9"
        />
      </div>

      <Select
        value={filters.productId ?? 'all'}
        onValueChange={(value) =>
          onChange({ ...filters, productId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-full sm:w-[240px]">
          <SelectValue placeholder="Tüm ürünler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm ürünler</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
