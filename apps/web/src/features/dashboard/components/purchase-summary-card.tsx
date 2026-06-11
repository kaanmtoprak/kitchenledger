'use client';

import type { PurchaseSummaryBySupplier } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatCount, formatCurrency } from '../utils/dashboard-formatters';

type PurchaseSummaryCardProps = {
  data?: PurchaseSummaryBySupplier[];
  isLoading?: boolean;
  isError?: boolean;
};

export function PurchaseSummaryCard({ data, isLoading, isError }: PurchaseSummaryCardProps) {
  const items = data ?? [];

  return (
    <DashboardSectionCard
      title="Tedarikçiye Göre Satın Almalar"
      description="Seçili aralıkta en çok alım yapan tedarikçiler"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Seçili tarih aralığında satın alma kaydı yok."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.supplierId ?? 'no-supplier'}
            className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{item.supplierName}</p>
              <p className="text-xs text-muted-foreground">
                {formatCount(item.purchaseCount)} satın alma
              </p>
            </div>
            <p className="text-sm font-medium">{formatCurrency(item.totalPurchaseCost)}</p>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
