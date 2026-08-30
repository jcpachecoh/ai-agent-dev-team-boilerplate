import React, { useMemo, type CSSProperties, type JSX, type ReactNode } from 'react';

import { SedePagination } from '../sede-pagination';
import { SedeTableHeader } from '../sede-table-header';
import { defaultSedeColumns, getSedeTableMinWidthPx } from '../shared/sede-columns';
import type { SedeSortDirection } from '../shared/sede-columns';
import type { SedePaginationProps } from '../sede-pagination';
import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeTable.module.scss';

export interface SedeTableProps {
  children?: ReactNode;
  footer?: ReactNode;
  pagination?: SedePaginationProps;
  sortKey?: string | null;
  sortDirection?: SedeSortDirection;
  onSortChange?: (columnKey: string) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeTable({
  children,
  footer,
  pagination,
  sortKey = null,
  sortDirection = 'asc',
  onSortChange,
  theme = 'dark',
  size = 'md',
  className,
}: SedeTableProps): JSX.Element {
  const tableMinWidthPx = getSedeTableMinWidthPx();
  const headerColumns = useMemo(
    () =>
      defaultSedeColumns.map((column) => ({
        ...column,
        active: sortKey === column.key,
        sortDirection: sortKey === column.key ? sortDirection : null,
        onSort: column.sortable && onSortChange ? () => onSortChange(column.key) : undefined,
      })),
    [onSortChange, sortDirection, sortKey],
  );

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de sedes"
    >
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--sede-table-min-width': `${tableMinWidthPx}px`,
            } as CSSProperties
          }
        >
          <SedeTableHeader
            columns={headerColumns}
            theme={theme}
            size={size}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {children}
          </div>
        </div>
      </div>
      {footer ?? (pagination ? <SedePagination theme={theme} size={size} {...pagination} /> : null)}
    </section>
  );
}

export default SedeTable;
