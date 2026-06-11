'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProductionTrendItem } from '../types/dashboard.types';
import { DashboardSectionCard } from './dashboard-section-card';
import { formatChartDate, formatCurrency, formatCount } from '../utils/dashboard-formatters';

type ProductionTrendChartProps = {
  data?: ProductionTrendItem[];
  isLoading?: boolean;
  isError?: boolean;
};

type ChartPoint = ProductionTrendItem & {
  totalCostValue: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatChartDate(label ?? point.date)}</p>
      <p className="text-muted-foreground">Maliyet: {formatCurrency(point.totalCost)}</p>
      <p className="text-muted-foreground">Üretimler: {formatCount(point.productionCount)}</p>
    </div>
  );
}

export function ProductionTrendChart({ data, isLoading, isError }: ProductionTrendChartProps) {
  const chartData: ChartPoint[] =
    data?.map((item) => ({
      ...item,
      totalCostValue: Number.parseFloat(item.totalCost) || 0,
    })) ?? [];

  return (
    <DashboardSectionCard
      title="Üretim Trendi"
      description="Seçili aralıkta günlük üretim maliyeti"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && chartData.length === 0}
      emptyMessage="Seçili aralık için üretim verisi yok."
      contentClassName="pt-2"
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="productionCostFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrency(value)}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={88}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalCostValue"
              stroke="var(--foreground)"
              fill="url(#productionCostFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardSectionCard>
  );
}
