'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, FileText, Package, Receipt, Search } from 'lucide-react';
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
import { purchasesApi } from '@/features/purchases/api/purchases.api';
import {
  calculateItemsTotal,
  type PurchaseListItem,
} from '@/features/purchases/types/purchase.types';
import { suppliersApi } from '@/features/suppliers/api/suppliers.api';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { downloadCsv, formatCsvCurrency, formatCsvDateTime, type CsvColumn } from '@/lib/utils/csv';
import { fetchPaginatedRecords, REPORT_PREVIEW_LIMIT } from '@/lib/utils/fetch-paginated';
import { formatCurrency, formatDateTime } from '@/lib/utils/display';
import { ReportSummaryCards } from './report-summary-cards';
import { ReportsToolbar } from './reports-toolbar';
import { summarizePurchases } from '../utils/report-summaries';
import { toEndOfDayIso, toStartOfDayIso } from '../utils/report-date';
import type { PurchasesReportFilterState } from '../types/reports.types';

const defaultFilters: PurchasesReportFilterState = {
  search: '',
  from: '',
  to: '',
};

type PurchasesReportRow = PurchaseListItem & {
  branchName: string;
  supplierName: string;
  itemCount: number;
  totalAmount: number;
};

export function PurchasesReportTab() {
  const { selectedOrganizationId } = useAuth();
  const { branches, branchesQuery } = useAccessibleBranches({
    queryKeySuffix: 'reports-purchases',
  });
  const [filters, setFilters] = useState<PurchasesReportFilterState>(defaultFilters);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', selectedOrganizationId, 'reports'],
    queryFn: () => suppliersApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });

  const branchNameById = useMemo(
    () => Object.fromEntries(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );
  const supplierNameById = useMemo(
    () =>
      Object.fromEntries(
        (suppliersQuery.data?.data ?? []).map((supplier) => [supplier.id, supplier.name]),
      ),
    [suppliersQuery.data],
  );

  const queryKey = [
    'reports',
    'purchases',
    selectedOrganizationId,
    debouncedSearch,
    filters.branchId,
    filters.supplierId,
    filters.from,
    filters.to,
  ];

  const reportQuery = useQuery({
    queryKey,
    queryFn: () =>
      fetchPaginatedRecords((page, limit) =>
        purchasesApi.list({
          page,
          limit,
          includeItems: true,
          q: debouncedSearch || undefined,
          branchId: filters.branchId,
          supplierId: filters.supplierId,
          from: filters.from ? toStartOfDayIso(filters.from) : undefined,
          to: filters.to ? toEndOfDayIso(filters.to) : undefined,
        }),
      ),
    enabled: Boolean(selectedOrganizationId),
  });

  const rows = useMemo<PurchasesReportRow[]>(
    () =>
      (reportQuery.data?.data ?? []).map((purchase) => ({
        ...purchase,
        branchName: branchNameById[purchase.branchId] ?? purchase.branchId,
        supplierName: purchase.supplierId
          ? (supplierNameById[purchase.supplierId] ?? purchase.supplierId)
          : 'Tedarikçi Yok',
        itemCount: purchase.items?.length ?? 0,
        totalAmount: calculateItemsTotal(purchase.items),
      })),
    [reportQuery.data, branchNameById, supplierNameById],
  );

  const previewRows = rows.slice(0, REPORT_PREVIEW_LIMIT);
  const summary = useMemo(() => summarizePurchases(rows), [rows]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const columns: CsvColumn<PurchasesReportRow>[] = [
        { header: 'Satın Alma Tarihi', value: (row) => formatCsvDateTime(row.purchasedAt) },
        { header: 'Fatura No', value: (row) => row.invoiceNumber ?? '' },
        { header: 'Şube', value: (row) => row.branchName },
        { header: 'Tedarikçi', value: (row) => row.supplierName },
        { header: 'Kalem Sayısı', value: (row) => row.itemCount },
        { header: 'Toplam Tutar', value: (row) => formatCsvCurrency(row.totalAmount) },
        { header: 'Notlar', value: (row) => row.notes ?? '' },
      ];
      downloadCsv('satin-alma-raporu.csv', rows, columns);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Fatura numarasına göre ara..."
            className="pl-9"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BranchFilterSelect
            value={filters.branchId}
            branches={branches}
            isLoading={branchesQuery.isLoading}
            onChange={(branchId) => setFilters({ ...filters, branchId })}
          />

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Tedarikçi</Label>
            <Select
              value={filters.supplierId ?? 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, supplierId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm tedarikçiler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm tedarikçiler</SelectItem>
                {(suppliersQuery.data?.data ?? []).map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
            title: 'Toplam Satın Alma Tutarı',
            value: formatCurrency(summary.totalAmount),
            icon: Receipt,
          },
          {
            title: 'Satın Alma Sayısı',
            value: String(summary.purchaseCount),
            icon: FileText,
          },
          {
            title: 'Toplam Kalem Sayısı',
            value: String(summary.itemCount),
            icon: Package,
          },
          {
            title: 'Ortalama Satın Alma Tutarı',
            value: formatCurrency(summary.averageAmount),
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
                <TableHead>Tarih</TableHead>
                <TableHead>Fatura No</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead className="text-right">Kalem Sayısı</TableHead>
                <TableHead className="text-right">Toplam Tutar</TableHead>
                <TableHead>Notlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(row.purchasedAt)}
                  </TableCell>
                  <TableCell>{row.invoiceNumber?.trim() ? row.invoiceNumber : '—'}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{row.branchName}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{row.supplierName}</TableCell>
                  <TableCell className="text-right">{row.itemCount}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(row.totalAmount)}
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
