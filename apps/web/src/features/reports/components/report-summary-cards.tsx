'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type ReportSummaryCard = {
  title: string;
  value: string;
  icon: LucideIcon;
};

type ReportSummaryCardsProps = {
  cards: ReportSummaryCard[];
  isLoading?: boolean;
};

export function ReportSummaryCards({ cards, isLoading }: ReportSummaryCardsProps) {
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
