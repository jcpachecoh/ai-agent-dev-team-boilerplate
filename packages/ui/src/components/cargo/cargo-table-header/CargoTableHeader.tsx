import type { CSSProperties, JSX } from 'react';

import styles from './CargoTableHeader.module.scss';
import { TableSortIcon } from '../../table-sort-icon';
import {
  defaultCargoColumns as defaultCargoHeaderColumns,
  getGridTemplateFromColumns,
  type CargoColumnDef,
} from '../shared/cargo-columns';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export type { CargoSortColumnKey, CargoSortDirection } from '../shared/cargo-columns';

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export interface CargoTableHeaderProps {
  columns?: CargoColumnDef[];
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoTableHeader({
  columns = defaultCargoHeaderColumns,
  theme = 'dark',
  size = 'md',
  className,
}: CargoTableHeaderProps): JSX.Element {
  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--cargo-columns': getGridTemplateFromColumns(columns) } as CSSProperties}
    >
      {columns.map((column) => {
        const isSortable = Boolean(column.sortable && column.onSort);
        const alignClass = alignClasses[column.align ?? 'left'];
        const content = (
          <>
            <span className={styles.label}>{column.label}</span>
            {column.sortable ? (
              <span className={styles.sortIcon}>
                <TableSortIcon
                  direction={column.sortDirection}
                  inactiveClassName={styles.sortIconMuted}
                />
              </span>
            ) : null}
          </>
        );

        if (isSortable) {
          return (
            <button
              key={column.key}
              type="button"
              className={[
                styles.cell,
                alignClass,
                styles.sortable,
                column.active && styles.cellActive,
              ]
                .filter(Boolean)
                .join(' ')}
              role="columnheader"
              aria-sort={
                column.sortDirection === 'asc'
                  ? 'ascending'
                  : column.sortDirection === 'desc'
                    ? 'descending'
                    : 'none'
              }
              onClick={column.onSort}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={column.key} className={[styles.cell, alignClass].join(' ')} role="columnheader">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default CargoTableHeader;
