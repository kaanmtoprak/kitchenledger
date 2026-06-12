'use client';

import { CostExplanation } from '@/components/common/cost-explanation';
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

function hasServingCost(cost: RecipeCostResponse): boolean {
  const servings = Number.parseFloat(cost.recipe.product.defaultServingCount ?? '');
  return Number.isFinite(servings) && servings > 0;
}

export function CostBreakdown({ cost }: CostBreakdownProps) {
  const { recipe, branch, items, summary } = cost;
  const showServingCost = hasServingCost(cost);

  return (
    <div className="space-y-6">
      <CostExplanation variant="recipe" />

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
          <p className="text-muted-foreground">Verim miktarı</p>
          <p className="font-medium">
            {formatQuantityDisplay(recipe.yieldQuantity)} {formatBaseUnit(recipe.yieldUnit)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Varsayılan porsiyon</p>
          <p className="font-medium">
            {showServingCost ? formatQuantityDisplay(recipe.product.defaultServingCount) : '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Toplam reçete maliyeti</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.totalCost)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Verim başına maliyet</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.unitCost)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Toplam reçete maliyetinin reçete verimine bölünmesiyle hesaplanır.
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Porsiyon maliyeti</p>
          <p className="text-lg font-semibold">
            {showServingCost ? formatCurrency(summary.servingCost) : '—'}
          </p>
          {showServingCost ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Ürünün varsayılan porsiyon sayısına göre hesaplanır.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Maliyet dökümü</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Malzeme</TableHead>
                <TableHead>Malzeme Kodu</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Birim</TableHead>
                <TableHead className="text-right">Ort. birim maliyet</TableHead>
                <TableHead className="text-right">Maliyet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.ingredientId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="max-w-[180px] truncate font-medium">
                        {item.ingredientName}
                      </span>
                      {item.isMissingCost ? (
                        <Badge variant="outline" className="text-xs">
                          Maliyet yok
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right">
                    {formatQuantityDisplay(item.quantity)}
                  </TableCell>
                  <TableCell>{formatBaseUnit(item.unit)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.weightedAverageUnitCost)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
