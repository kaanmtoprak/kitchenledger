'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Factory, Package, Receipt } from 'lucide-react';
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
import { productionsApi } from '@/features/productions/api/productions.api';
import type { ProductionListItem } from '@/features/productions/types/production.types';
import { productsApi } from '@/features/products/api/products.api';
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
import { formatCurrency, formatDateTime, formatQuantityDisplay } from '@/lib/utils/display';
import { ReportSummaryCards } from './report-summary-cards';
import { ReportsToolbar } from './reports-toolbar';
import { summarizeProductions } from '../utils/report-summaries';
import { toEndOfDayIso, toStartOfDayIso } from '../utils/report-date';
import type { ProductionsReportFilterState } from '../types/reports.types';

const defaultFilters: ProductionsReportFilterState = {
  from: '',
  to: '',
};

export function ProductionsReportTab() {
  const { selectedOrganizationId } = useAuth();
  const { branches, branchesQuery } = useAccessibleBranches({
    queryKeySuffix: 'reports-productions',
  });
  const [filters, setFilters] = useState<ProductionsReportFilterState>(defaultFilters);
  const [isExporting, setIsExporting] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['products', selectedOrganizationId, 'reports'],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const reportQuery = useQuery({
    queryKey: [
      'reports',
      'productions',
      selectedOrganizationId,
      filters.branchId,
      filters.productId,
      filters.from,
      filters.to,
    ],
    queryFn: () =>
      fetchPaginatedRecords((page, limit) =>
        productionsApi.list({
          page,
          limit,
          branchId: filters.branchId,
          productId: filters.productId,
          from: filters.from ? toStartOfDayIso(filters.from) : undefined,
          to: filters.to ? toEndOfDayIso(filters.to) : undefined,
        }),
      ),
    enabled: Boolean(selectedOrganizationId),
  });

  const rows = useMemo(() => reportQuery.data?.data ?? [], [reportQuery.data]);
  const previewRows = rows.slice(0, REPORT_PREVIEW_LIMIT);
  const summary = useMemo(() => summarizeProductions(rows), [rows]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const columns: CsvColumn<ProductionListItem>[] = [
        { header: 'Üretim Tarihi', value: (row) => formatCsvDateTime(row.producedAt) },
        { header: 'Ürün', value: (row) => row.productName },
        { header: 'Şube', value: (row) => row.branchName },
        {
          header: 'Üretilen Miktar',
          value: (row) => formatCsvNumber(row.quantityProduced),
        },
        {
          header: 'Toplam Maliyet',
          value: (row) => formatCsvCurrency(row.totalCostSnapshot),
        },
        {
          header: 'Birim Maliyet',
          value: (row) => formatCsvCurrency(row.unitCostSnapshot),
        },
        { header: 'Notlar', value: (row) => row.notes ?? '' },
      ];
      downloadCsv('uretim-raporu.csv', rows, columns);
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
          <Label className="mb-2 block text-xs text-muted-foreground">Ürün</Label>
          <Select
            value={filters.productId ?? 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, productId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm ürünler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm ürünler</SelectItem>
              {(productsQuery.data?.data ?? []).map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            title: 'Toplam Üretim Maliyeti',
            value: formatCurrency(summary.totalCost),
            icon: Receipt,
          },
          {
            title: 'Üretim Sayısı',
            value: String(summary.productionCount),
            icon: Factory,
          },
          {
            title: 'Toplam Üretilen Miktar',
            value: formatQuantityDisplay(String(summary.totalQuantity)),
            icon: Package,
          },
          {
            title: 'Ortalama Birim Maliyet',
            value: formatCurrency(summary.averageUnitCost),
            icon: Calculator,
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
                <TableHead>Üretim Tarihi</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead className="text-right">Üretilen Miktar</TableHead>
                <TableHead className="text-right">Toplam Maliyet</TableHead>
                <TableHead className="text-right">Birim Maliyet</TableHead>
                <TableHead>Notlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(row.producedAt)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">{row.productName}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{row.branchName}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatQuantityDisplay(row.quantityProduced)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(row.totalCostSnapshot)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(row.unitCostSnapshot)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {row.notes?.trim() || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
