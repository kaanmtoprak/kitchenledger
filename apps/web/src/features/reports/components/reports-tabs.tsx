'use client';

import { cn } from '@/lib/utils';
import type { ReportTabId } from '../types/reports.types';

const tabs: Array<{ id: ReportTabId; label: string }> = [
  { id: 'purchases', label: 'Satın Almalar' },
  { id: 'productions', label: 'Üretimler' },
  { id: 'movements', label: 'Stok Hareketleri' },
  { id: 'orders', label: 'Siparişler' },
];

type ReportsTabsProps = {
  activeTab: ReportTabId;
  onChange: (tab: ReportTabId) => void;
};

export function ReportsTabs({ activeTab, onChange }: ReportsTabsProps) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-white text-muted-foreground shadow-sm hover:text-foreground',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
