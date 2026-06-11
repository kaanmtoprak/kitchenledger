'use client';

import { Boxes, History, Layers, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCount, formatCurrency } from '@/lib/utils/display';

type InventoryOverviewCardsProps = {
  totalStockValue: number;
  lowStockCount: number;
  batchesCount: number;
  movementsCount: number;
  isLoading?: boolean;
};

export function InventoryOverviewCards({
  totalStockValue,
  lowStockCount,
  batchesCount,
  movementsCount,
  isLoading,
}: InventoryOverviewCardsProps) {
  const cards = [
    {
      title: 'Toplam Stok Değeri',
      value: formatCurrency(totalStockValue),
      icon: Boxes,
    },
    {
      title: 'Kritik Stok Sayısı',
      value: formatCount(lowStockCount),
      icon: TriangleAlert,
    },
    {
      title: 'Stok Partileri',
      value: formatCount(batchesCount),
      icon: Layers,
    },
    {
      title: 'Stok Hareketleri',
      value: formatCount(movementsCount),
      icon: History,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
