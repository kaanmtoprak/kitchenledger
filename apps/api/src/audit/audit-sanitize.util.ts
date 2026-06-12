import { Prisma } from '@kitchenledger/db';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtokenhash',
  'accesstoken',
  'refreshtoken',
  'token',
  'secret',
  'database_url',
  'jwt_access_secret',
  'jwt_refresh_secret',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

export function removeSensitiveFields<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => removeSensitiveFields(item)) as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (isSensitiveKey(key)) {
      continue;
    }

    result[key] = removeSensitiveFields(nestedValue);
  }

  return result as T;
}

export function toAuditJson(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  const serialized = JSON.parse(
    JSON.stringify(value, (_key, nestedValue) => {
      if (
        nestedValue &&
        typeof nestedValue === 'object' &&
        'toFixed' in nestedValue &&
        typeof nestedValue.toFixed === 'function'
      ) {
        return nestedValue.toString();
      }

      if (nestedValue instanceof Date) {
        return nestedValue.toISOString();
      }

      return nestedValue;
    }),
  );

  const sanitized = removeSensitiveFields(serialized);

  if (sanitized === null || sanitized === undefined) {
    return null;
  }

  if (Array.isArray(sanitized)) {
    return sanitized;
  }

  return sanitized as Prisma.InputJsonValue;
}
