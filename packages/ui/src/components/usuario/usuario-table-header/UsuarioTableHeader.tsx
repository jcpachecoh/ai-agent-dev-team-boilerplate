import type { CSSProperties, JSX } from 'react';

import { TableSortIcon } from '../../table-sort-icon';
import {
  getUsuarioColumns,
  getUsuarioGridTemplate,
  type UsuarioColumnDef,
} from '../shared/usuario-columns';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioTableHeader.module.scss';

export type { UsuarioSortColumnKey, UsuarioSortDirection } from '../shared/usuario-columns';

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export interface UsuarioTableHeaderProps {
  columns?: UsuarioColumnDef[];
  showActions?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioTableHeader({
  columns,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioTableHeaderProps): JSX.Element {
  const resolvedColumns = columns ?? getUsuarioColumns(showActions);

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--usuario-columns': getUsuarioGridTemplate(showActions) } as CSSProperties}
    >
      {resolvedColumns.map((column) => {
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

export default UsuarioTableHeader;
