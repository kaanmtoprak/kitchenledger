'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Factory, History, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BranchFilterSelect } from '@/components/common/branch-filter-select';
import { EmptyState } from '@/components/common/empty-state';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import type { StockMovementItem, StockMovementType } from '@/features/inventory/types/inventory.types';
import { ingredientsApi } from '@/features/ingredients/api/ingredients.api';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import {
  downloadCsv,
  formatCsvCurrency,
  formatCsvDateTime,
  formatCsvNumber,
  type CsvColumn,
} from '@/lib/utils/csv';
import { fetchPaginatedRecords, REPORT_PREVIEW_LIMIT } from '@/lib/utils/fetch-paginated';
import {
  formatCurrency,
  formatDateTime,
  formatMovementType,
  formatQuantityDisplay,
  formatUnit,
} from '@/lib/utils/display';
import { ReportSummaryCards } from './report-summary-cards';
import { ReportsToolbar } from './reports-toolbar';
import {
  getMovementTotalCost,
  getMovementUnitCost,
  summarizeStockMovements,
} from '../utils/report-summaries';
import { toEndOfDayIso, toStartOfDayIso } from '../utils/report-date';
import type { StockMovementsReportFilterState } from '../types/reports.types';

const movementTypeOptions: Array<{ value: StockMovementType; label: string }> = [
  { value: 'PURCHASE', label: 'Satın Alma' },
  { value: 'PRODUCTION_CONSUMPTION', label: 'Üretim Tüketimi' },
  { value: 'WASTE', label: 'Fire / Zayi' },
  { value: 'RETURN', label: 'İade' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manuel Düzeltme' },
];

const defaultFilters: StockMovementsReportFilterState = {
  from: '',
  to: '',
};

type StockMovementReportRow = StockMovementItem & {
  unitCostValue: number | null;
  totalCostValue: number | null;
};

export function StockMovementsReportTab() {
  const { selectedOrganizationId } = useAuth();
  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'reports-movements' });
  const [filters, setFilters] = useState<StockMovementsReportFilterState>(defaultFilters);
  const [isExporting, setIsExporting] = useState(false);

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', selectedOrganizationId, 'reports'],
    queryFn: () => ingredientsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const reportQuery = useQuery({
    queryKey: [
      'reports',
      'movements',
      selectedOrganizationId,
      filters.branchId,
      filters.ingredientId,
      filters.movementType,
      filters.from,
      filters.to,
    ],
    queryFn: () =>
      fetchPaginatedRecords((page, limit) =>
        inventoryApi.listMovements({
          page,
          limit,
          branchId: filters.branchId,
          ingredientId: filters.ingredientId,
          type: filters.movementType,
          from: filters.from ? toStartOfDayIso(filters.from) : undefined,
          to: filters.to ? toEndOfDayIso(filters.to) : undefined,
        }),
      ),
    enabled: Boolean(selectedOrganizationId),
  });

  const rows = useMemo<StockMovementReportRow[]>(
    () =>
      (reportQuery.data?.data ?? []).map((movement) => ({
        ...movement,
        unitCostValue: getMovementUnitCost(movement),
        totalCostValue: getMovementTotalCost(movement),
      })),
    [reportQuery.data],
  );

  const previewRows = rows.slice(0, REPORT_PREVIEW_LIMIT);
  const summary = useMemo(() => summarizeStockMovements(rows), [rows]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const columns: CsvColumn<StockMovementReportRow>[] = [
        { header: 'Tarih', value: (row) => formatCsvDateTime(row.createdAt) },
        { header: 'Hareket Tipi', value: (row) => formatMovementType(row.type) },
        { header: 'Şube', value: (row) => row.branch.name },
        { header: 'Malzeme', value: (row) => row.ingredient.name },
        { header: 'Miktar', value: (row) => formatCsvNumber(row.quantity) },
        { header: 'Birim', value: (row) => formatUnit(row.unit) },
        {
          header: 'Birim Maliyet',
          value: (row) =>
            row.unitCostValue !== null ? formatCsvCurrency(row.unitCostValue) : '',
        },
        {
          header: 'Toplam Maliyet',
          value: (row) =>
            row.totalCostValue !== null ? formatCsvCurrency(row.totalCostValue) : '',
        },
        { header: 'Açıklama', value: (row) => row.reason ?? '' },
      ];
      downloadCsv('stok-hareketleri-raporu.csv', rows, columns);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BranchFilterSelect
          value={filters.branchId}
          branches={branches}
          isLoading={branchesQuery.isLoading}
          onChange={(branchId) => setFilters({ ...filters, branchId })}
        />

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Malzeme</Label>
          <Select
            value={filters.ingredientId ?? 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, ingredientId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm malzemeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm malzemeler</SelectItem>
              {(ingredientsQuery.data?.data ?? []).map((ingredient) => (
                <SelectItem key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Hareket Tipi</Label>
          <Select
            value={filters.movementType ?? 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  movementType: value === 'all' ? undefined : (value as StockMovementType),
                })
              }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm hareketler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm hareketler</SelectItem>
              {movementTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Başlangıç</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ ...filters, from: event.target.value })}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Bitiş</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters({ ...filters, to: event.target.value })}
            />
          </div>
        </div>
      </div>

      <ReportsToolbar
        onClearFilters={() => setFilters(defaultFilters)}
        onExport={handleExport}
        isExportDisabled={rows.length === 0}
        isExporting={isExporting}
      />

      {reportQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(reportQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      <ReportSummaryCards
        isLoading={reportQuery.isLoading}
        cards={[
          {
            title: 'Hareket Sayısı',
            value: String(summary.movementCount),
            icon: History,
          },
          {
            title: 'Satın Alma Hareketi',
            value: String(summary.purchaseCount),
            icon: ShoppingCart,
          },
          {
            title: 'Üretim Tüketimi',
            value: String(summary.productionCount),
            icon: Factory,
          },
          {
            title: 'Fire / İade / Manuel',
            value: String(summary.adjustmentCount),
            icon: ArrowLeftRight,
          },
        ]}
      />

      {reportQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Rapor verileri yükleniyor...</p>
      ) : previewRows.length === 0 ? (
        <EmptyState
          title="Seçilen filtrelerle kayıt bulunamadı."
          description="Filtreleri genişletmeyi veya temizlemeyi deneyin."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Hareket Tipi</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Malzeme</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Birim</TableHead>
                <TableHead className="text-right">Birim Maliyet</TableHead>
                <TableHead className="text-right">Toplam Maliyet</TableHead>
                <TableHead>Açıklama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatMovementType(row.type)}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">{row.branch.name}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{row.ingredient.name}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatQuantityDisplay(row.quantity)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatUnit(row.unit)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {row.unitCostValue !== null ? formatCurrency(row.unitCostValue) : '—'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {row.totalCostValue !== null ? formatCurrency(row.totalCostValue) : '—'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.reason?.trim() || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
