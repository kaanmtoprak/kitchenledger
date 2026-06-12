import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { DashboardDateRangePreset } from '../types/dashboard.types';

export function getDateRangeFromPreset(preset: DashboardDateRangePreset): {
  from: string;
  to: string;
} {
  const to = new Date();
  const from = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) {
    return '—';
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCount(value: number | undefined): string {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('tr-TR').format(value);
}

export function formatQuantity(value: string | undefined): string {
  if (!value) {
    return '—';
  }

  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) {
    return value;
  }

  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatChartDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(parsed);
}

export function formatActivityDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDistanceToNow(parsed, { addSuffix: true, locale: tr });
}

export function translateActivityItem(item: {
  type: 'PRODUCTION' | 'PURCHASE';
  title: string;
  description: string;
}): { title: string; description: string } {
  if (item.type === 'PRODUCTION') {
    const cancelledMatch = item.title.match(/^Üretim iptal edildi: (.+)$/);
    if (cancelledMatch) {
      const cancelledQtyMatch = item.description.match(/^İptal: (.+) adet$/);
      return {
        title: item.title,
        description: cancelledQtyMatch
          ? `İptal edilen miktar: ${cancelledQtyMatch[1]}`
          : item.description,
      };
    }

    const producedMatch = item.title.match(/^Produced (.+)$/);
    const quantityCostMatch = item.description.match(/^Quantity: (.+), Cost: (.+)$/);

    return {
      title: producedMatch ? `${producedMatch[1]} üretildi` : item.title,
      description: quantityCostMatch
        ? `Miktar: ${quantityCostMatch[1]}, Maliyet: ${quantityCostMatch[2]}`
        : item.description,
    };
  }

  const invoiceMatch = item.description.match(/^Invoice: (.+)$/);

  return {
    title: item.title === 'Purchase received' ? 'Satın alma kaydı' : item.title,
    description: invoiceMatch
      ? `Fatura: ${invoiceMatch[1]}`
      : item.description === 'Purchase received'
        ? 'Satın alma kaydı'
        : item.description,
  };
}
