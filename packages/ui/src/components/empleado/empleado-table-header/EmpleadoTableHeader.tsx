import type { CSSProperties, JSX } from 'react';

import { TableSortIcon } from '../../table-sort-icon';
import { defaultEmpleadoColumns, type EmpleadoColumnDef } from '../shared/empleado-columns';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoTableHeader.module.scss';

export type { EmpleadoSortColumnKey, EmpleadoSortDirection } from '../shared/empleado-columns';

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

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
  // Se deriva directamente de `columns` (no se recalcula por separado vía
  // getEmpleadoGridTemplate) para que el grid-template-columns del header
  // nunca pueda desincronizarse del número real de celdas renderizadas abajo.
  const gridTemplate = columns.map((column) => column.width ?? '1fr').join(' ');

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--empleado-columns': gridTemplate } as CSSProperties}
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

export default EmpleadoTableHeader;
