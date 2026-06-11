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
import type { Product } from '@/features/products/types/product.types';

export type ProductionsFilterState = {
  search: string;
  branchId?: string;
  productId?: string;
  from: string;
  to: string;
};

type ProductionsFiltersProps = {
  filters: ProductionsFilterState;
  branches: Branch[];
  products: Product[];
  onChange: (filters: ProductionsFilterState) => void;
};

export function ProductionsFilters({
  filters,
  branches,
  products,
  onChange,
}: ProductionsFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Ürün adı veya ürün koduna göre ara..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Şube</Label>
          <Select
            value={filters.branchId ?? 'all'}
            onValueChange={(value) =>
              onChange({ ...filters, branchId: value === 'all' ? undefined : value })
            }
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

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Ürün</Label>
          <Select
            value={filters.productId ?? 'all'}
            onValueChange={(value) =>
              onChange({ ...filters, productId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
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
