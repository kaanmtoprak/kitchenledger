import { Prisma } from '@kitchenledger/db';

export function toDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function serializeDecimal(value: Prisma.Decimal | null): string | null {
  return value?.toString() ?? null;
}
