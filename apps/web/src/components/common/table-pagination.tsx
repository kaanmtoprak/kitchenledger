'use client';

import { Button } from '@/components/ui/button';
import type { PaginatedMeta } from '@/features/branches/types/branch.types';

type TablePaginationProps = {
  meta?: PaginatedMeta;
  onPageChange: (page: number) => void;
};

export function TablePagination({ meta, onPageChange }: TablePaginationProps) {
  if (!meta || meta.total === 0) {
    return null;
  }

  const canGoPrevious = meta.page > 1;
  const canGoNext = meta.page < meta.totalPages;

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {meta.total} kayıt · Sayfa {meta.page} / {meta.totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Önceki
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
