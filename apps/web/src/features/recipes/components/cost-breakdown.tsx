'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBaseUnit, formatCurrency, formatQuantityDisplay } from '@/lib/utils/display';
import type { RecipeCostResponse } from '../types/recipe.types';

type CostBreakdownProps = {
  cost: RecipeCostResponse;
};

export function CostBreakdown({ cost }: CostBreakdownProps) {
  const { recipe, branch, items, summary } = cost;

  return (
    <div className="space-y-6">
      {summary.hasMissingCosts ? (
        <Alert>
          <AlertDescription>
            Bazı malzemelerin bu şubede stok maliyeti yok. Toplam kısmi hesaplanmıştır.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Reçete</p>
          <p className="font-medium">{recipe.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ürün</p>
          <p className="font-medium">
            {recipe.product.name} ({recipe.product.sku})
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Şube</p>
          <p className="font-medium">{branch.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Verim</p>
          <p className="font-medium">
            {formatQuantityDisplay(recipe.yieldQuantity)} {formatBaseUnit(recipe.yieldUnit)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Varsayılan porsiyon</p>
          <p className="font-medium">{formatQuantityDisplay(recipe.product.defaultServingCount)}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Toplam maliyet</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.totalCost)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Birim maliyet</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.unitCost)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Porsiyon maliyeti</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.servingCost)}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Maliyet dökümü</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Malzeme</TableHead>
              <TableHead>Malzeme Kodu</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead>Ort. birim maliyet</TableHead>
              <TableHead>Maliyet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.ingredientId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.ingredientName}</span>
                    {item.isMissingCost ? (
                      <Badge variant="outline" className="text-xs">
                        Maliyet yok
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{formatQuantityDisplay(item.quantity)}</TableCell>
                <TableCell>{formatBaseUnit(item.unit)}</TableCell>
                <TableCell>{formatCurrency(item.weightedAverageUnitCost)}</TableCell>
                <TableCell>{formatCurrency(item.cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
