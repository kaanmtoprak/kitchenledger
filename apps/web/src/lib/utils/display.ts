import type { BaseUnit } from '@/features/ingredients/types/ingredient.types';
import type { OrderStatus } from '@/features/orders/types/order.types';
import type { PurchaseStatus } from '@/features/purchases/types/purchase.types';

const baseUnitLabels: Record<BaseUnit, string> = {
  GRAM: 'Gram',
  KILOGRAM: 'Kilogram',
  MILLILITER: 'Mililitre',
  LITER: 'Litre',
  PIECE: 'Adet',
};

export function formatBaseUnit(unit: BaseUnit): string {
  return baseUnitLabels[unit];
}

export function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatCount(value: number | undefined): string {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('tr-TR').format(value);
}

export function formatCurrency(value: string | number | null | undefined): string {
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

export function formatUnit(unit: string): string {
  if (unit in baseUnitLabels) {
    return baseUnitLabels[unit as BaseUnit];
  }
  return unit;
}

const movementTypeLabels: Record<string, string> = {
  PURCHASE: 'Satın Alma',
  PRODUCTION_CONSUMPTION: 'Üretim Tüketimi',
  MANUAL_ADJUSTMENT: 'Manuel Düzeltme',
  WASTE: 'Fire / Zayi',
  RETURN: 'İade',
};

export function formatMovementType(type: string): string {
  return movementTypeLabels[type] ?? type;
}

export function formatDate(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
  }).format(parsed);
}

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  IN_PRODUCTION: 'Hazırlanıyor',
  READY: 'Hazır',
  DELIVERED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

export function formatOrderStatus(status: OrderStatus | string): string {
  return orderStatusLabels[status as OrderStatus] ?? status;
}

const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  ACTIVE: 'Aktif',
  CANCELLED: 'İptal Edildi',
};

export function formatPurchaseStatus(status: PurchaseStatus | string): string {
  return purchaseStatusLabels[status as PurchaseStatus] ?? status;
}

export function formatQuantityDisplay(value: string | null | undefined): string {
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
