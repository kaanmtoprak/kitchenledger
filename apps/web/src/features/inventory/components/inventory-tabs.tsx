'use client';

import { Button } from '@/components/ui/button';
import type { InventoryTab } from '../types/inventory.types';
import { cn } from '@/lib/utils';

const tabs: { id: InventoryTab; label: string }[] = [
  { id: 'stock', label: 'Stok' },
  { id: 'batches', label: 'Partiler' },
  { id: 'movements', label: 'Hareketler' },
];

type InventoryTabsProps = {
  activeTab: InventoryTab;
  onChange: (tab: InventoryTab) => void;
};

export function InventoryTabs({ activeTab, onChange }: InventoryTabsProps) {
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
