import type { PaginatedMeta, PaginatedResponse } from '@/features/branches/types/branch.types';

export const REPORT_API_PAGE_LIMIT = 100;
export const REPORT_EXPORT_MAX_RECORDS = 1000;
export const REPORT_PREVIEW_LIMIT = 50;

type PageFetcher<T> = (
  page: number,
  limit: number,
) => Promise<PaginatedResponse<T>>;

export async function fetchPaginatedRecords<T>(
  fetchPage: PageFetcher<T>,
  maxRecords = REPORT_EXPORT_MAX_RECORDS,
  pageLimit = REPORT_API_PAGE_LIMIT,
): Promise<{ data: T[]; meta: PaginatedMeta | null }> {
  const data: T[] = [];
  let page = 1;
  let meta: PaginatedMeta | null = null;

  while (data.length < maxRecords) {
    const response = await fetchPage(page, pageLimit);
    meta = response.meta;
    data.push(...response.data);

    if (response.data.length === 0 || page >= response.meta.totalPages) {
      break;
    }

    page += 1;
  }

  return {
    data: data.slice(0, maxRecords),
    meta,
  };
}
