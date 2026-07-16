import { useCallback, useMemo, useState } from 'react';

import {
  TABLE_PAGE_SIZE,
  getTablePaginationRange,
  paginateItems,
  type TablePaginationRange,
} from './table-pagination';

export interface UseClientTablePaginationResult<T> {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  pageItems: T[];
  range: TablePaginationRange;
  onPrevious: () => void;
  onNext: () => void;
}

/** Client-side pagination for lists loaded fully in memory. */
export function useClientTablePagination<T>(
  items: T[],
  pageSize: number = TABLE_PAGE_SIZE,
): UseClientTablePaginationResult<T> {
  const [page, setPageState] = useState(1);
  const range = useMemo(
    () => getTablePaginationRange(page, pageSize, items.length),
    [page, pageSize, items.length],
  );

  const setPage = useCallback(
    (next: number) => {
      setPageState(Math.min(Math.max(1, next), range.totalPages));
    },
    [range.totalPages],
  );

  // Keep page in bounds when the filtered list shrinks.
  const safePage = Math.min(page, range.totalPages);
  const pageItems = useMemo(
    () => paginateItems(items, safePage, pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    pageSize,
    setPage,
    pageItems,
    range: getTablePaginationRange(safePage, pageSize, items.length),
    onPrevious: () => setPage(safePage - 1),
    onNext: () => setPage(safePage + 1),
  };
}
