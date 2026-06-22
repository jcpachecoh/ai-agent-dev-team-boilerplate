import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CSSProperties, JSX } from 'react';

import {
  defaultEmpleadoColumns,
  getEmpleadoGridTemplate,
  type EmpleadoColumnDef,
} from '../shared/empleado-columns';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoTableHeader.module.scss';

export type { EmpleadoSortColumnKey, EmpleadoSortDirection } from '../shared/empleado-columns';

export interface EmpleadoTableHeaderProps {
  columns?: EmpleadoColumnDef[];
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoTableHeader({
  columns = defaultEmpleadoColumns,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoTableHeaderProps): JSX.Element {
  const showActions = columns.some((column) => column.key === 'actions');

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--empleado-columns': getEmpleadoGridTemplate(showActions) } as CSSProperties}
    >
      {columns.map((column) => {
        const isSortable = Boolean(column.sortable && column.onSort);
        const content = (
          <>
            <span className={styles.label}>{column.label}</span>
            {column.sortable ? (
              <span className={styles.sortIcon} aria-hidden>
                {column.sortDirection === 'asc' ? (
                  <ChevronUp size={10} />
                ) : column.sortDirection === 'desc' ? (
                  <ChevronDown size={10} />
                ) : (
                  <ChevronDown size={10} className={styles.sortIconMuted} />
                )}
              </span>
            ) : null}
          </>
        );

        if (isSortable) {
          return (
            <button
              key={column.key}
              type="button"
              className={[styles.cell, styles.sortable, column.active && styles.cellActive]
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
          <div key={column.key} className={styles.cell} role="columnheader">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default EmpleadoTableHeader;
