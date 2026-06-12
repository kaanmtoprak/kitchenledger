'use client';

import { Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ReportsToolbarProps = {
  onClearFilters: () => void;
  onExport: () => void;
  isExportDisabled?: boolean;
  isExporting?: boolean;
};

export function ReportsToolbar({
  onClearFilters,
  onExport,
  isExportDisabled,
  isExporting,
}: ReportsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        CSV dışa aktarımı mevcut filtrelerle en fazla 1000 kayıt indirir.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Filtreleri Temizle
        </Button>
        <Button
          type="button"
          size="sm"
          className="shadow-sm"
          onClick={onExport}
          disabled={isExportDisabled || isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'İndiriliyor...' : 'CSV İndir'}
        </Button>
      </div>
    </div>
  );
}
