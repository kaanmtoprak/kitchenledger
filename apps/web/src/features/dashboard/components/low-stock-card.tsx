'use client';

import { Badge } from '@/components/ui/badge';
import type { LowStockItem } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatUnit } from '@/lib/utils/display';
import { formatQuantity } from '../utils/dashboard-formatters';

type LowStockCardProps = {
  data?: LowStockItem[];
  isLoading?: boolean;
  isError?: boolean;
};

export function LowStockCard({ data, isLoading, isError }: LowStockCardProps) {
  const items = data ?? [];

  return (
    <DashboardSectionCard
      title="Kritik Stok"
      description="Şubeye göre kritik malzemeler"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Kritik stokta malzeme yok."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.branchId}-${item.ingredientId}`}
            className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{item.ingredientName}</p>
                <Badge variant={item.isOutOfStock ? 'destructive' : 'secondary'}>
                  {item.isOutOfStock ? 'Stokta yok' : 'Düşük stok'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.sku} · {item.branchName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatQuantity(item.totalRemaining)} / {formatQuantity(item.minimumStockLevel)}{' '}
                {formatUnit(item.unit)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium text-destructive">-{formatQuantity(item.shortage)}</p>
              <p className="text-xs text-muted-foreground">eksik</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
