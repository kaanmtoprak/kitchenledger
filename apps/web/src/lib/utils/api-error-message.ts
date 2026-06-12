import { ApiError } from '@/lib/api/api-error';
import { formatBaseUnit } from '@/lib/utils/display';
import type { BaseUnit } from '@/features/ingredients/types/ingredient.types';

const exactMessages: Record<string, string> = {
  'Invalid credentials': 'E-posta veya şifre hatalı.',
  'Email is already registered': 'Bu e-posta adresi zaten kayıtlı.',
  'User account is inactive': 'Kullanıcı hesabı pasif.',
  'Refresh token is missing': 'Oturum yenileme bilgisi bulunamadı.',
  'Invalid refresh token': 'Geçersiz oturum yenileme bilgisi.',
  'Product already has a recipe': 'Bu ürün için zaten bir reçete tanımlanmış.',
  'Recipe has no items': 'Reçetede kalem bulunmuyor.',
  'Recipe yield quantity must be greater than zero': 'Reçete verim miktarı sıfırdan büyük olmalı.',
  'Duplicate ingredient in recipe items': 'Reçetede aynı malzeme birden fazla kez eklenemez.',
  'Duplicate ingredient in purchase items': 'Satın almada aynı malzeme birden fazla kez eklenemez.',
  'Invalid quantity produced': 'Üretilen miktar geçersiz.',
  'Invalid quantity or total price': 'Miktar veya toplam tutar geçersiz.',
  'Branch not found': 'Şube bulunamadı.',
  'Product not found': 'Ürün bulunamadı.',
  'Recipe not found': 'Reçete bulunamadı.',
  'Supplier not found': 'Tedarikçi bulunamadı.',
  'Ingredient not found': 'Malzeme bulunamadı.',
  'Production not found': 'Üretim kaydı bulunamadı.',
  'Supplier name already exists': 'Bu tedarikçi adı zaten mevcut.',
  'Branch code already exists': 'Bu şube kodu zaten mevcut.',
  'Product SKU already exists': 'Bu ürün kodu zaten mevcut.',
  'No access to this branch': 'Bu şubeye erişim yetkiniz yok.',
  'No access to this organization': 'Bu işletmeye erişim yetkiniz yok.',
  'One or more ingredients not found': 'Bir veya daha fazla malzeme bulunamadı.',
  'Order not found': 'Sipariş bulunamadı.',
  'Duplicate product in order items': 'Aynı ürün birden fazla kez eklenemez.',
  'Invalid quantity or unit price': 'Miktar veya birim fiyat geçersiz.',
  'One or more products not found': 'Bir veya daha fazla ürün bulunamadı.',
  'Stock batch not found': 'Stok partisi bulunamadı.',
  'Unit cost is required': 'Birim maliyet gereklidir.',
  'Unit cost cannot be negative': 'Birim maliyet negatif olamaz.',
  'Invalid quantity': 'Miktar geçersiz.',
  'Reason is required': 'Açıklama zorunludur.',
  'Adjustment direction is required': 'Manuel düzeltme için yön seçilmelidir.',
  'Invalid adjustment type': 'Geçersiz işlem tipi.',
};

type InsufficientStockDetails = {
  ingredientName?: string;
  requiredQuantity?: string;
  availableQuantity?: string;
  unit?: string;
};

type StructuredApiErrorBody = {
  code?: string;
  message?: string;
  details?: InsufficientStockDetails;
};

function formatInsufficientStockMessage(details: InsufficientStockDetails): string | null {
  if (!details.ingredientName || !details.requiredQuantity || !details.availableQuantity) {
    return null;
  }

  const unitLabel = details.unit ? formatBaseUnit(details.unit as BaseUnit) : details.unit ?? '';
  return `${details.ingredientName} için yeterli stok yok. Gerekli: ${details.requiredQuantity} ${unitLabel}, Mevcut: ${details.availableQuantity} ${unitLabel}`;
}

function translateInsufficientStock(message: string): string | null {
  const match = message.match(
    /^Insufficient stock for (.+)\. Required: ([\d.]+) (\w+), available: ([\d.]+) (\w+)$/i,
  );
  if (!match) {
    return null;
  }

  const [, name, required, unit, available] = match;
  return formatInsufficientStockMessage({
    ingredientName: name,
    requiredQuantity: required,
    availableQuantity: available,
    unit,
  });
}

function translateUnitMismatch(message: string): string | null {
  const match = message.match(/^Unit mismatch for ingredient (.+): expected (\w+)$/);
  if (!match) {
    return null;
  }

  const [, name, unit] = match;
  return `${name} için birim uyuşmuyor. Beklenen: ${formatBaseUnit(unit as BaseUnit)}`;
}

function extractStructuredBody(error: ApiError): StructuredApiErrorBody | null {
  const details = error.details;
  if (!details || typeof details !== 'object') {
    return null;
  }

  const body = details as Record<string, unknown>;
  const messageField = body.message;

  if (messageField && typeof messageField === 'object' && !Array.isArray(messageField)) {
    return messageField as StructuredApiErrorBody;
  }

  if (typeof body.code === 'string') {
    return {
      code: body.code,
      message: typeof body.message === 'string' ? body.message : undefined,
      details:
        body.details && typeof body.details === 'object'
          ? (body.details as InsufficientStockDetails)
          : undefined,
    };
  }

  return null;
}

function translateBackendMessage(message: string, error?: ApiError): string {
  const structured = error ? extractStructuredBody(error) : null;
  if (structured?.code === 'INSUFFICIENT_STOCK') {
    const fromDetails = structured.details
      ? formatInsufficientStockMessage(structured.details)
      : null;
    if (fromDetails) {
      return fromDetails;
    }
    if (structured.message) {
      const translated = translateInsufficientStock(structured.message);
      if (translated) {
        return translated;
      }
    }
  }

  if (exactMessages[message]) {
    return exactMessages[message];
  }

  const insufficientStock = translateInsufficientStock(message);
  if (insufficientStock) {
    return insufficientStock;
  }

  const unitMismatch = translateUnitMismatch(message);
  if (unitMismatch) {
    return unitMismatch;
  }

  return message;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Beklenmeyen bir hata oluştu.',
): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Bu işlem için yetkiniz yok.';
    }
    if (error.status === 401) {
      return 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.';
    }
    if (error.status === 404) {
      return error.message
        ? translateBackendMessage(error.message, error)
        : 'Kayıt bulunamadı.';
    }
    if (error.status === 409) {
      return error.message
        ? translateBackendMessage(error.message, error)
        : 'Bu kayıt zaten mevcut veya işlem mevcut verilerle çakışıyor.';
    }
    if (error.status === 400) {
      return error.message
        ? translateBackendMessage(error.message, error)
        : 'Geçersiz istek. Lütfen alanları kontrol edin.';
    }
    if (error.message) {
      return translateBackendMessage(error.message, error);
    }
    return fallback;
  }

  return fallback;
}
