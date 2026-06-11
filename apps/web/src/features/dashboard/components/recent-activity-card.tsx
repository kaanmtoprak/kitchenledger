'use client';

import { Factory, ShoppingCart } from 'lucide-react';
import type { RecentActivityItem } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatActivityDate, translateActivityItem } from '../utils/dashboard-formatters';

type RecentActivityCardProps = {
  data?: RecentActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
};

function ActivityIcon({ type }: { type: RecentActivityItem['type'] }) {
  if (type === 'PRODUCTION') {
    return <Factory className="h-4 w-4 text-muted-foreground" />;
  }

  return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
}

export function RecentActivityCard({ data, isLoading, isError }: RecentActivityCardProps) {
  const items = data ?? [];

  return (
    <DashboardSectionCard
      title="Son Hareketler"
      description="Son üretim ve satın alma olayları"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Henüz kayıtlı hareket yok. Satın alma veya üretim oluşturduğunuzda burada görünür."
    >
      <div className="space-y-4">
        {items.map((item) => {
          const activity = translateActivityItem(item);

          return (
            <div key={`${item.type}-${item.id}`} className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/40">
                <ActivityIcon type={item.type} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatActivityDate(item.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{item.branchName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
