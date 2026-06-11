'use client';

import type { ComponentType } from 'react';
import { AlertTriangle, Boxes, Factory, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  getValue: (summary: DashboardSummary) => string;
  getSubtitle: (summary: DashboardSummary) => string;
}[] = [
  {
    key: 'stock-value',
    title: 'Toplam Stok Değeri',
    description: 'Seçili şubelerdeki güncel stok değeri',
    icon: Boxes,
    getValue: (summary) => formatCurrency(summary.inventory.totalStockValue),
    getSubtitle: (summary) =>
      `${formatCount(summary.inventory.activeIngredientCount)} aktif malzeme`,
  },
  {
    key: 'low-stock',
    title: 'Kritik Stoklar',
    description: 'Minimum seviyenin altında veya eşiğinde',
    icon: AlertTriangle,
    getValue: (summary) => formatCount(summary.inventory.lowStockIngredientCount),
    getSubtitle: () => 'Seçili şubeler genelinde',
  },
  {
    key: 'purchase-cost',
    title: 'Satın Alma Maliyeti',
    description: 'Seçili tarih aralığındaki toplam harcama',
    icon: ShoppingCart,
    getValue: (summary) => formatCurrency(summary.purchases.totalPurchaseCost),
    getSubtitle: (summary) => `${formatCount(summary.purchases.purchaseCount)} satın alma`,
  },
  {
    key: 'production-cost',
    title: 'Üretim Maliyeti',
    description: 'FIFO ile kaydedilen üretim maliyeti toplamı',
    icon: Factory,
    getValue: (summary) => formatCurrency(summary.production.totalProductionCost),
    getSubtitle: (summary) => `${formatCount(summary.production.productionCount)} üretim`,
  },
  {
    key: 'active-products',
    title: 'Aktif Ürünler',
    description: 'Üretime açık tanımlı ürün sayısı',
    icon: Package,
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
          <Card key={metric.key} className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <CardDescription>{metric.description}</CardDescription>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : isError ? (
                <p className="text-sm text-muted-foreground">Yüklenemedi</p>
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary ? metric.getValue(summary) : '—'}
                  </p>
                  {summary ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {metric.getSubtitle(summary)}
                    </p>
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
