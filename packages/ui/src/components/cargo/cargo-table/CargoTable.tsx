import type { CSSProperties, JSX, ReactNode } from 'react';

import styles from './CargoTable.module.scss';
import { CargoPagination, type CargoPaginationProps } from '../cargo-pagination';
import { CargoTableHeader } from '../cargo-table-header';
import {
  buildCargoHeaderColumns,
  getCargoTableMinWidthPx,
  type CargoSortColumnKey,
  type CargoSortDirection,
} from '../shared/cargo-columns';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoTableProps {
  children?: ReactNode;
  footer?: ReactNode;
  pagination?: CargoPaginationProps;
  showActions?: boolean;
  sortColumn?: CargoSortColumnKey | null;
  sortDirection?: CargoSortDirection;
  onSortColumn?: (column: CargoSortColumnKey) => void;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoTable({
  children,
  footer,
  pagination,
  showActions = true,
  sortColumn = null,
  sortDirection = 'asc',
  onSortColumn,
  theme = 'dark',
  size = 'md',
  className,
}: CargoTableProps): JSX.Element {
  const columns = buildCargoHeaderColumns(showActions, sortColumn, sortDirection, onSortColumn);
  const tableMinWidthPx = getCargoTableMinWidthPx(showActions);

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de cargos"
    >
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--cargo-table-min-width': `${tableMinWidthPx}px`,
            } as CSSProperties
          }
        >
          <CargoTableHeader
            columns={columns}
            theme={theme}
            size={size}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {children}
          </div>
        </div>
      </div>
      {footer ??
        (pagination ? <CargoPagination theme={theme} size={size} {...pagination} /> : null)}
    </section>
  );
}

export default CargoTable;
