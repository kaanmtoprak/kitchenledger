'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { productsApi } from '@/features/products/api/products.api';
import { useAuth } from '@/lib/auth/use-auth';
import { ApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { formatBaseUnit, formatCurrency, formatQuantityDisplay } from '@/lib/utils/display';
import { calculateEstimatedProductionCost } from '../types/production.types';

type ProductionCostPreviewProps = {
  branchId: string;
  productId: string;
  quantityProduced: string;
};

export function ProductionCostPreview({
  branchId,
  productId,
  quantityProduced,
}: ProductionCostPreviewProps) {
  const { selectedOrganizationId } = useAuth();

  const costQuery = useQuery({
    queryKey: ['products', 'cost', 'preview', selectedOrganizationId, productId, branchId],
    queryFn: () => productsApi.getCost(productId, { branchId }),
    enabled: Boolean(selectedOrganizationId && branchId && productId),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  if (costQuery.isLoading) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  const isNoRecipeError =
    costQuery.isError && costQuery.error instanceof ApiError && costQuery.error.status === 404;

  if (isNoRecipeError) {
    return (
      <Alert>
        <AlertDescription>Bu ürünün henüz bir reçetesi yok.</AlertDescription>
      </Alert>
    );
  }

  if (costQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(costQuery.error, 'Maliyet önizlemesi yüklenemedi.')}
        </AlertDescription>
      </Alert>
    );
  }

  if (!costQuery.data) {
    return null;
  }

  const { summary, items } = costQuery.data;
  const { estimatedUnitCost, estimatedTotalCost } = calculateEstimatedProductionCost(
    summary.unitCost,
    quantityProduced,
  );

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Tahmini maliyet önizlemesi</p>
        <p className="text-xs text-muted-foreground">
          Tahmini maliyet ortalama stok maliyetine, gerçek üretim maliyeti FIFO&apos;ya göre
          hesaplanır.
        </p>
      </div>

      {summary.hasMissingCosts ? (
        <Alert>
          <AlertDescription>
            Bazı malzeme maliyetleri eksik. Gerçek üretim başarısız olabilir veya kısmen tahmin
            edilebilir.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Tahmini birim maliyet</p>
          <p className="font-medium">{formatCurrency(estimatedUnitCost)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tahmini toplam maliyet</p>
          <p className="font-medium">{formatCurrency(estimatedTotalCost)}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Reçete maliyet temeli</p>
          <ul className="space-y-1 text-muted-foreground">
            {items.slice(0, 5).map((item) => (
              <li key={item.ingredientId}>
                {item.ingredientName}: {formatQuantityDisplay(item.quantity)}{' '}
                {formatBaseUnit(item.unit)} — {formatCurrency(item.cost)}
                {item.isMissingCost ? ' (eksik)' : ''}
              </li>
            ))}
            {items.length > 5 ? (
              <li className="text-xs">+ {items.length - 5} malzeme daha</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
