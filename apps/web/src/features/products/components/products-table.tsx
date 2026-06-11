'use client';

import { Calculator, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import { emptyListTitle, READ_ONLY_EMPTY_HINT } from '@/lib/utils/empty-state-messages';
import { formatDateTime, formatQuantityDisplay } from '@/lib/utils/display';
import type { Product } from '../types/product.types';

type ProductsTableProps = {
  products: Product[];
  isLoading?: boolean;
  canEdit?: boolean;
  canDeactivate?: boolean;
  onEdit: (product: Product) => void;
  onDeactivate: (product: Product) => void;
  onViewCost: (product: Product) => void;
  onCreate?: () => void;
};

export function ProductsTable({
  products,
  isLoading,
  canEdit = true,
  canDeactivate = true,
  onEdit,
  onDeactivate,
  onViewCost,
  onCreate,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canEdit, 'Henüz ürün yok')}
        description={
          canEdit
            ? 'Satılabilir ürünlerinizi tanımlayın; ardından reçete ve maliyet takibine geçin.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canEdit ? (
            <Button type="button" onClick={onCreate}>
              Ürün Oluştur
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ad</TableHead>
          <TableHead>Ürün Kodu</TableHead>
          <TableHead>Varsayılan Porsiyon</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="w-[70px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.sku}</TableCell>
            <TableCell>{formatQuantityDisplay(product.defaultServingCount)}</TableCell>
            <TableCell>
              <Badge variant={product.isActive ? 'secondary' : 'outline'}>
                {product.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(product.createdAt)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewCost(product)}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Maliyeti Gör
                  </DropdownMenuItem>
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                  ) : null}
                  {canDeactivate && product.isActive ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeactivate(product)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Pasife Al
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
