/** Default page size for list tables across the web app (Empleados style). */
export const TABLE_PAGE_SIZE = 8;

/** Common selectable page sizes; 8 is the default product standard. */
export const TABLE_PAGE_SIZE_OPTIONS = [8, 20, 50, 100] as const;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export interface TablePaginationRange {
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  /** e.g. "17-24 de 138" */
  summary: string;
  /** e.g. "Pág. 3/18" */
  pageLabel: string;
}

/**
 * Builds the standard table pagination labels used across modules:
 * left summary `start-end de total`, right `Pág. page/totalPages`.
 */
export function getTablePaginationRange(
  page: number,
  pageSize: number,
  total: number,
): TablePaginationRange {
  const safePageSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageStart = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const pageEnd = Math.min(safePage * safePageSize, safeTotal);

  return {
    totalPages,
    pageStart,
    pageEnd,
    summary: `${pageStart}-${pageEnd} de ${safeTotal}`,
    pageLabel: `Pág. ${safePage}/${totalPages}`,
  };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  return items.slice(start, start + Math.max(1, pageSize));
}
