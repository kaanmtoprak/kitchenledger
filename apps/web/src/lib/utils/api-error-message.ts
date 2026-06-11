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
};

function translateInsufficientStock(message: string): string | null {
  const match = message.match(
    /^Insufficient stock for (.+)\. Required: ([\d.]+) (\w+), available: ([\d.]+) (\w+)$/,
  );
  if (!match) {
    return null;
  }

  const [, name, required, unit, available] = match;
  const unitLabel = formatBaseUnit(unit as BaseUnit);
  return `${name} için yeterli stok yok. Gerekli: ${required} ${unitLabel}, Mevcut: ${available} ${unitLabel}`;
}

function translateUnitMismatch(message: string): string | null {
  const match = message.match(/^Unit mismatch for ingredient (.+): expected (\w+)$/);
  if (!match) {
    return null;
  }

  const [, name, unit] = match;
  return `${name} için birim uyuşmuyor. Beklenen: ${formatBaseUnit(unit as BaseUnit)}`;
}

function translateBackendMessage(message: string): string {
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
      return error.message ? translateBackendMessage(error.message) : 'Kayıt bulunamadı.';
    }
    if (error.status === 409) {
      return error.message
        ? translateBackendMessage(error.message)
        : 'Bu kayıt zaten mevcut veya işlem mevcut verilerle çakışıyor.';
    }
    if (error.status === 400) {
      return error.message
        ? translateBackendMessage(error.message)
        : 'Geçersiz istek. Lütfen alanları kontrol edin.';
    }
    if (error.message) {
      return translateBackendMessage(error.message);
    }
    return fallback;
  }

  return fallback;
}
