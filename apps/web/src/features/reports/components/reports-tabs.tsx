'use client';

import { Button } from '@/components/ui/button';
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
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          size="sm"
          variant={activeTab === tab.id ? 'default' : 'outline'}
          className={cn(activeTab === tab.id && 'pointer-events-none')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
