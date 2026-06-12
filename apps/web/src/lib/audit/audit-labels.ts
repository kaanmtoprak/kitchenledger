export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Oluşturma',
  UPDATE: 'Güncelleme',
  DELETE: 'Silme',
  DEACTIVATE: 'Pasife Alma',
  ACTIVATE: 'Aktifleştirme',
  STATUS_CHANGE: 'Durum Değişikliği',
  STOCK_ADJUSTMENT: 'Stok Düzeltme',
  LOGIN: 'Giriş',
  LOGOUT: 'Çıkış',
};

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  TeamMember: 'Kullanıcı',
  Purchase: 'Satın Alma',
  Production: 'Üretim',
  Order: 'Sipariş',
  InventoryAdjustment: 'Stok Düzeltme',
  Ingredient: 'Malzeme',
  Supplier: 'Tedarikçi',
  Branch: 'Şube',
  Product: 'Ürün',
  Recipe: 'Reçete',
};

export const AUDIT_ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'DEACTIVATE',
  'ACTIVATE',
  'STATUS_CHANGE',
  'STOCK_ADJUSTMENT',
] as const;

export const AUDIT_ENTITY_TYPE_OPTIONS = [
  'TeamMember',
  'Purchase',
  'Production',
  'Order',
  'InventoryAdjustment',
  'Ingredient',
  'Supplier',
  'Branch',
  'Product',
  'Recipe',
] as const;

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function formatAuditEntityType(entityType: string): string {
  return AUDIT_ENTITY_TYPE_LABELS[entityType] ?? entityType;
}
