'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const defaultAccentBars = [
  'bg-blue-500/70',
  'bg-violet-500/70',
  'bg-emerald-500/70',
  'bg-amber-500/70',
];

export type ReportSummaryCard = {
  title: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  accentBar?: string;
  valueClassName?: string;
  className?: string;
};

type ReportSummaryCardsProps = {
  cards: ReportSummaryCard[];
  isLoading?: boolean;
};

export function ReportSummaryCards({ cards, isLoading }: ReportSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const accentBar = card.accentBar ?? defaultAccentBars[index % defaultAccentBars.length];

        return (
          <Card
            key={card.title}
            className={cn(
              'relative overflow-hidden bg-white transition-all duration-200 hover:-translate-y-px hover:shadow-card-hover',
              card.className,
            )}
          >
            <div className={cn('absolute inset-x-0 top-0 h-[3px]', accentBar)} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
              <CardTitle className="text-[13px] font-semibold">{card.title}</CardTitle>
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
                  card.iconClassName,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p
                  className={cn(
                    'text-[26px] font-semibold tabular-nums tracking-tight text-foreground',
                    card.valueClassName,
                  )}
                >
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
