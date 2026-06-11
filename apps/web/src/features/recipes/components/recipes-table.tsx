'use client';

import { Calculator, Eye, MoreHorizontal, Pencil } from 'lucide-react';
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
import { formatBaseUnit, formatDateTime, formatQuantityDisplay } from '@/lib/utils/display';
import type { RecipeListItem } from '../types/recipe.types';

type RecipesTableProps = {
  recipes: RecipeListItem[];
  isLoading?: boolean;
  canEdit?: boolean;
  onView: (recipe: RecipeListItem) => void;
  onEdit: (recipe: RecipeListItem) => void;
  onViewCost: (recipe: RecipeListItem) => void;
  onCreate?: () => void;
};

export function RecipesTable({
  recipes,
  isLoading,
  canEdit = true,
  onView,
  onEdit,
  onViewCost,
  onCreate,
}: RecipesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        title="Henüz reçete yok"
        description="Ürün maliyetlerini hesaplamak ve üretime hazırlanmak için reçete oluşturun."
        action={
          onCreate && canEdit ? (
            <Button type="button" onClick={onCreate}>
              Reçete Oluştur
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
          <TableHead>Reçete Adı</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead>Verim</TableHead>
          <TableHead>Kalem Sayısı</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="w-[70px] text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => (
          <TableRow key={recipe.id}>
            <TableCell className="font-medium">{recipe.name}</TableCell>
            <TableCell>
              <div>
                <p>{recipe.product.name}</p>
                <p className="text-xs text-muted-foreground">{recipe.product.sku}</p>
              </div>
            </TableCell>
            <TableCell>
              {formatQuantityDisplay(recipe.yieldQuantity)} {formatBaseUnit(recipe.yieldUnit)}
            </TableCell>
            <TableCell>{recipe.itemCount}</TableCell>
            <TableCell>{formatDateTime(recipe.createdAt)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(recipe)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Detayı Gör
                  </DropdownMenuItem>
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => onEdit(recipe)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => onViewCost(recipe)}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Maliyeti Gör
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
