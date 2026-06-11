import { BadRequestException } from '@nestjs/common';

export type DashboardDateRange = {
  from: Date;
  to: Date;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function parseDashboardDateRange(
  from?: string,
  to?: string,
): DashboardDateRange {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - THIRTY_DAYS_MS);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new BadRequestException('Invalid date range');
  }

  if (fromDate > toDate) {
    throw new BadRequestException('from must be before or equal to to');
  }

  return { from: fromDate, to: toDate };
}
