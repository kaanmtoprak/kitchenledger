'use client';

import type { TopProductByCost } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatCount, formatCurrency } from '../utils/dashboard-formatters';

type TopProductsCardProps = {
  data?: TopProductByCost[];
  isLoading?: boolean;
  isError?: boolean;
};

export function TopProductsCard({ data, isLoading, isError }: TopProductsCardProps) {
  const items = data ?? [];

  return (
    <DashboardSectionCard
      title="Maliyete Göre En Çok Üretilen Ürünler"
      description="Seçili aralıkta en yüksek üretim maliyeti"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Seçili aralık için üretim verisi yok."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.productSku}</p>
              <p className="text-xs text-muted-foreground">
                {formatCount(item.productionCount)} üretim
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{formatCurrency(item.totalProductionCost)}</p>
              <p className="text-xs text-muted-foreground">
                ort. {formatCurrency(item.averageUnitCost)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
