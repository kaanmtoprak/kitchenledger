'use client';

import { Badge } from '@/components/ui/badge';
import type { LowStockItem } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatUnit } from '@/lib/utils/display';
import { formatQuantity } from '../utils/dashboard-formatters';
import { cn } from '@/lib/utils';

type LowStockCardProps = {
  data?: LowStockItem[];
  isLoading?: boolean;
  isError?: boolean;
};

function getStockRatio(item: LowStockItem): number {
  const remaining = Number.parseFloat(item.totalRemaining);
  const minimum = Number.parseFloat(item.minimumStockLevel);
  if (!Number.isFinite(remaining) || !Number.isFinite(minimum) || minimum <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (remaining / minimum) * 100));
}

export function LowStockCard({ data, isLoading, isError }: LowStockCardProps) {
  const items = data ?? [];

  return (
    <DashboardSectionCard
      title="Kritik Stok"
      description="Şubeye göre kritik malzemeler"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Şu an kritik seviyede malzeme bulunmuyor. Bu iyi bir haber."
    >
      <div className="space-y-2">
        {items.map((item) => {
          const ratio = getStockRatio(item);

          return (
            <div
              key={`${item.branchId}-${item.ingredientId}`}
              className={cn(
                'rounded-lg border p-3 transition-colors duration-150',
                item.isOutOfStock
                  ? 'border-red-100 bg-red-50/60'
                  : 'border-amber-100 bg-amber-50/40 hover:bg-amber-50/60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.ingredientName}
                    </p>
                    <Badge variant={item.isOutOfStock ? 'destructive' : 'warning'}>
                      {item.isOutOfStock ? 'Stokta yok' : 'Düşük stok'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} · {item.branchName}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatQuantity(item.totalRemaining)} / {formatQuantity(item.minimumStockLevel)}{' '}
                      {formatUnit(item.unit)}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/60">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          item.isOutOfStock ? 'bg-red-500/80' : 'bg-amber-500/80',
                        )}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-red-600">
                    -{formatQuantity(item.shortage)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">eksik</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
