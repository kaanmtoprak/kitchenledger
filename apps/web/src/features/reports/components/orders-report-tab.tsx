'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, ClipboardList, PieChart, Receipt, Search } from 'lucide-react';
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
import { ordersApi } from '@/features/orders/api/orders.api';
import type { OrderListItem, OrderStatus } from '@/features/orders/types/order.types';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import {
  downloadCsv,
  formatCsvCurrency,
  formatCsvDate,
  formatCsvDateTime,
  type CsvColumn,
} from '@/lib/utils/csv';
import { fetchPaginatedRecords, REPORT_PREVIEW_LIMIT } from '@/lib/utils/fetch-paginated';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderStatus,
  ORDER_STATUS_OPTIONS,
} from '@/lib/utils/display';
import { ReportSummaryCards } from './report-summary-cards';
import { ReportsToolbar } from './reports-toolbar';
import { summarizeOrders } from '../utils/report-summaries';
import { toEndOfDayIso, toStartOfDayIso } from '../utils/report-date';
import type { OrdersReportFilterState } from '../types/reports.types';

const defaultFilters: OrdersReportFilterState = {
  search: '',
  from: '',
  to: '',
};

type OrdersReportRow = OrderListItem & {
  branchName: string;
};

export function OrdersReportTab() {
  const { selectedOrganizationId } = useAuth();
  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'reports-orders' });
  const [filters, setFilters] = useState<OrdersReportFilterState>(defaultFilters);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const branchNameById = useMemo(
    () => Object.fromEntries(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const reportQuery = useQuery({
    queryKey: [
      'reports',
      'orders',
      selectedOrganizationId,
      debouncedSearch,
      filters.branchId,
      filters.status,
      filters.from,
      filters.to,
    ],
    queryFn: () =>
      fetchPaginatedRecords((page, limit) =>
        ordersApi.list({
          page,
          limit,
          q: debouncedSearch || undefined,
          branchId: filters.branchId,
          status: filters.status,
          from: filters.from ? toStartOfDayIso(filters.from) : undefined,
          to: filters.to ? toEndOfDayIso(filters.to) : undefined,
        }),
      ),
    enabled: Boolean(selectedOrganizationId),
  });

  const rows = useMemo<OrdersReportRow[]>(
    () =>
      (reportQuery.data?.data ?? []).map((order) => ({
        ...order,
        branchName: branchNameById[order.branchId] ?? order.branchId,
      })),
    [reportQuery.data, branchNameById],
  );

  const previewRows = rows.slice(0, REPORT_PREVIEW_LIMIT);
  const summary = useMemo(() => summarizeOrders(rows), [rows]);
  const statusSummary = Object.entries(summary.statusBreakdown)
    .map(([label, count]) => `${label}: ${count}`)
    .join(' · ');

  const handleExport = () => {
    setIsExporting(true);
    try {
      const columns: CsvColumn<OrdersReportRow>[] = [
        { header: 'Sipariş No', value: (row) => row.orderNumber },
        { header: 'Tarih', value: (row) => formatCsvDateTime(row.orderedAt) },
        { header: 'Müşteri', value: (row) => row.customer?.name ?? '' },
        { header: 'Şube', value: (row) => row.branchName },
        { header: 'Durum', value: (row) => formatOrderStatus(row.status) },
        { header: 'Kalem Sayısı', value: (row) => row.itemCount ?? 0 },
        { header: 'Toplam Tutar', value: (row) => formatCsvCurrency(row.totalAmount) },
        { header: 'Teslim Tarihi', value: (row) => formatCsvDate(row.dueAt) },
      ];
      downloadCsv('siparis-raporu.csv', rows, columns);
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
            placeholder="Sipariş no veya müşteri ara..."
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
            <Label className="mb-2 block text-xs text-muted-foreground">Durum</Label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: value === 'all' ? undefined : (value as OrderStatus),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatOrderStatus(status)}
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
            title: 'Toplam Sipariş Tutarı',
            value: formatCurrency(summary.totalAmount),
            icon: Receipt,
          },
          {
            title: 'Sipariş Sayısı',
            value: String(summary.orderCount),
            icon: ClipboardList,
          },
          {
            title: 'Ortalama Sipariş Tutarı',
            value: formatCurrency(summary.averageAmount),
            icon: Calculator,
          },
          {
            title: 'Durum Dağılımı',
            value: statusSummary || '—',
            icon: PieChart,
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
                <TableHead>Sipariş No</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Kalem Sayısı</TableHead>
                <TableHead className="text-right">Toplam Tutar</TableHead>
                <TableHead>Teslim Tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">{row.orderNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(row.orderedAt)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {row.customer?.name ?? '—'}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">{row.branchName}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">{row.itemCount ?? '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(row.totalAmount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.dueAt ? formatDate(row.dueAt) : '—'}
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
