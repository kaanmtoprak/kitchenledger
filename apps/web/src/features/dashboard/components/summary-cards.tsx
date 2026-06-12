'use client';

import type { ComponentType } from 'react';
import { AlertTriangle, Boxes, Factory, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '../types/dashboard.types';
import { formatCount, formatCurrency } from '../utils/dashboard-formatters';

type SummaryCardsProps = {
  summary?: DashboardSummary;
  isLoading?: boolean;
  isError?: boolean;
};

const metrics: {
  key: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  accentBar: string;
  getValue: (summary: DashboardSummary) => string;
  getSubtitle: (summary: DashboardSummary) => string;
}[] = [
  {
    key: 'stock-value',
    title: 'Toplam Stok Değeri',
    description: 'Seçili şubelerdeki güncel stok değeri',
    icon: Boxes,
    iconClassName: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
    accentBar: 'bg-blue-500/70',
    getValue: (summary) => formatCurrency(summary.inventory.totalStockValue),
    getSubtitle: (summary) =>
      `${formatCount(summary.inventory.activeIngredientCount)} aktif malzeme`,
  },
  {
    key: 'low-stock',
    title: 'Kritik Stoklar',
    description: 'Minimum seviyenin altında veya eşiğinde',
    icon: AlertTriangle,
    iconClassName: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    accentBar: 'bg-amber-500/70',
    getValue: (summary) => formatCount(summary.inventory.lowStockIngredientCount),
    getSubtitle: () => 'Seçili şubeler genelinde',
  },
  {
    key: 'purchase-cost',
    title: 'Satın Alma Maliyeti',
    description: 'Seçili tarih aralığındaki toplam harcama',
    icon: ShoppingCart,
    iconClassName: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
    accentBar: 'bg-violet-500/70',
    getValue: (summary) => formatCurrency(summary.purchases.totalPurchaseCost),
    getSubtitle: (summary) => `${formatCount(summary.purchases.purchaseCount)} satın alma`,
  },
  {
    key: 'production-cost',
    title: 'Üretim Maliyeti',
    description: 'FIFO ile kaydedilen üretim maliyeti toplamı',
    icon: Factory,
    iconClassName: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    accentBar: 'bg-emerald-500/70',
    getValue: (summary) => formatCurrency(summary.production.totalProductionCost),
    getSubtitle: (summary) => `${formatCount(summary.production.productionCount)} üretim`,
  },
  {
    key: 'active-products',
    title: 'Aktif Ürünler',
    description: 'Üretime açık tanımlı ürün sayısı',
    icon: Package,
    iconClassName: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
    accentBar: 'bg-slate-400/70',
    getValue: (summary) => formatCount(summary.products.activeProductCount),
    getSubtitle: (summary) => `Kapsamda ${formatCount(summary.branches.count)} şube`,
  },
];

export function SummaryCards({ summary, isLoading, isError }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card
            key={metric.key}
            className="relative overflow-hidden bg-white transition-all duration-200 hover:-translate-y-px hover:shadow-card-hover"
          >
            <div className={cn('absolute inset-x-0 top-0 h-[3px]', metric.accentBar)} />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5">
              <CardTitle className="text-[13px] font-semibold">{metric.title}</CardTitle>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconClassName}`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="line-clamp-2">{metric.description}</CardDescription>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : isError ? (
                <p className="text-sm text-muted-foreground">Yüklenemedi</p>
              ) : (
                <>
                  <p className="text-[26px] font-semibold tabular-nums tracking-tight text-foreground">
                    {summary ? metric.getValue(summary) : '—'}
                  </p>
                  {summary ? (
                    <p className="text-xs text-muted-foreground">{metric.getSubtitle(summary)}</p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
