'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatBaseUnit, formatQuantityDisplay } from '@/lib/utils/display';
import { recipesApi } from '../api/recipes.api';

type RecipeDetailDialogProps = {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecipeDetailDialog({ recipeId, open, onOpenChange }: RecipeDetailDialogProps) {
  const { selectedOrganizationId } = useAuth();

  const detailQuery = useQuery({
    queryKey: ['recipes', 'detail', selectedOrganizationId, recipeId],
    queryFn: () => recipesApi.getById(recipeId!),
    enabled: Boolean(open && recipeId && selectedOrganizationId),
  });

  const recipe = detailQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reçete Detayı</DialogTitle>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {getApiErrorMessage(detailQuery.error, 'Reçete detayı yüklenemedi.')}
            </AlertDescription>
          </Alert>
        ) : null}

        {recipe ? (
          <div className="space-y-6">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Reçete adı</p>
                <p className="font-medium">{recipe.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ürün</p>
                <p className="font-medium">
                  {recipe.product.name} ({recipe.product.sku})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Verim</p>
                <p className="font-medium">
                  {formatQuantityDisplay(recipe.yieldQuantity)} {formatBaseUnit(recipe.yieldUnit)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Kalem sayısı</p>
                <p className="font-medium">{recipe.items.length}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Kalemler</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Malzeme</TableHead>
                    <TableHead>Malzeme Kodu</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipe.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.ingredient.name}</TableCell>
                      <TableCell>{item.ingredient.sku}</TableCell>
                      <TableCell>{formatQuantityDisplay(item.quantity)}</TableCell>
                      <TableCell>{formatBaseUnit(item.unit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
