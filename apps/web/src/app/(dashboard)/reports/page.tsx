'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { OrdersReportTab } from '@/features/reports/components/orders-report-tab';
import { ProductionsReportTab } from '@/features/reports/components/productions-report-tab';
import { PurchasesReportTab } from '@/features/reports/components/purchases-report-tab';
import { ReportsTabs } from '@/features/reports/components/reports-tabs';
import { StockMovementsReportTab } from '@/features/reports/components/stock-movements-report-tab';
import type { ReportTabId } from '@/features/reports/types/reports.types';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabId>('purchases');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlar"
        description="Satın alma, üretim, stok hareketleri ve sipariş verilerini filtreleyin ve CSV olarak dışa aktarın."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <ReportsTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'purchases' ? <PurchasesReportTab /> : null}
          {activeTab === 'productions' ? <ProductionsReportTab /> : null}
          {activeTab === 'movements' ? <StockMovementsReportTab /> : null}
          {activeTab === 'orders' ? <OrdersReportTab /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
