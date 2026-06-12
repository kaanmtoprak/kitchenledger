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

const LOW_DATA_THRESHOLD = 3;
const CHART_TICK_COLOR = '#64748b';
const CHART_GRID_COLOR = '#e2e8f0';

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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground">{formatChartDate(label ?? point.date)}</p>
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

  const isLowData = chartData.length > 0 && chartData.length <= LOW_DATA_THRESHOLD;
  const chartHeight = isLowData ? 200 : 240;

  return (
    <DashboardSectionCard
      title="Üretim Trendi"
      description="Seçili aralıkta günlük üretim maliyeti"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && chartData.length === 0}
      emptyMessage="Seçili tarih aralığında üretim kaydı yok. Filtreyi genişletmeyi deneyin."
      contentClassName="pt-2"
    >
      {isLowData ? (
        <div className="mb-3 inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
          Seçili aralıkta sınırlı üretim verisi var.
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="productionCostFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={CHART_GRID_COLOR}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 12, fill: CHART_TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrency(value)}
              tick={{ fontSize: 12, fill: CHART_TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={88}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalCostValue"
              stroke="var(--primary)"
              fill="url(#productionCostFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </DashboardSectionCard>
  );
}
