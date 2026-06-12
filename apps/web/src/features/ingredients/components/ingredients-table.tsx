'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { formatBaseUnit, formatDateTime, formatQuantityDisplay } from '@/lib/utils/display';
import type { Ingredient } from '../types/ingredient.types';

type IngredientsTableProps = {
  ingredients: Ingredient[];
  isLoading?: boolean;
  canEdit?: boolean;
  canDeactivate?: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDeactivate: (ingredient: Ingredient) => void;
  onCreate?: () => void;
};

export function IngredientsTable({
  ingredients,
  isLoading,
  canEdit = true,
  canDeactivate = true,
  onEdit,
  onDeactivate,
  onCreate,
}: IngredientsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canEdit, 'Henüz malzeme yok')}
        description={
          canEdit
            ? 'Ham maddeleri tanımlayarak reçete maliyeti ve stok takibine başlayın.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canEdit ? (
            <Button type="button" onClick={onCreate}>
              Malzeme Oluştur
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
          <TableHead>Malzeme Kodu</TableHead>
          <TableHead>Temel Birim</TableHead>
          <TableHead>Minimum Stok</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturulma</TableHead>
          {canEdit || canDeactivate ? (
            <TableHead className="w-[70px] text-right">İşlemler</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => (
          <TableRow key={ingredient.id}>
            <TableCell className="font-medium">{ingredient.name}</TableCell>
            <TableCell>{ingredient.sku}</TableCell>
            <TableCell>{formatBaseUnit(ingredient.baseUnit)}</TableCell>
            <TableCell>{formatQuantityDisplay(ingredient.minimumStockLevel)}</TableCell>
            <TableCell>
              <Badge variant={ingredient.isActive ? 'success' : 'muted'}>
                {ingredient.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(ingredient.createdAt)}</TableCell>
            {canEdit || canDeactivate ? (
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menüyü aç</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(ingredient)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                    ) : null}
                    {canDeactivate && ingredient.isActive ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeactivate(ingredient)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Pasife Al
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
