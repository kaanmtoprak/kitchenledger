export function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '-');
}

export function normalizeSku(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeName(value: string): string {
  return value.trim();
}
