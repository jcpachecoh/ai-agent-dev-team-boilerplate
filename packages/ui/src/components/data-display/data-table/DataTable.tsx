import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import * as React from 'react';

import styles from './DataTable.module.scss';
import { EmptyState } from '../../feedback/empty-state';
import { Skeleton } from '../../feedback/skeleton';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  totalRows?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
  onExport?: (format: 'csv' | 'xlsx') => Promise<void>;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  theme = 'dark',
  size = 'md',
  className,
}: DataTableProps<TData, TValue>): React.JSX.Element {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  if (isLoading) {
    return (
      <div className={[styles.wrapper, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
        <Skeleton variant="table" width="100%" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={[styles.wrapper, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
        <EmptyState title="No data available" variant="search" />
      </div>
    );
  }

  return (
    <div className={[styles.wrapper, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
