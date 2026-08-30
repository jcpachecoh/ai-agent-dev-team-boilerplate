import type { CSSProperties, JSX, ReactNode } from 'react';

import styles from './CargoTable.module.scss';
import { CargoPagination, type CargoPaginationProps } from '../cargo-pagination';
import { CargoTableHeader } from '../cargo-table-header';
import { CargoTableGridTemplateProvider } from './CargoTableGridContext';
import {
  buildCargoHeaderColumns,
  getCargoColumns,
  getGridTemplateFromColumns,
  getTableMinWidthPxFromColumns,
  type CargoColumnDef,
  type CargoSortColumnKey,
  type CargoSortDirection,
} from '../shared/cargo-columns';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoTableProps {
  children?: ReactNode;
  footer?: ReactNode;
  pagination?: CargoPaginationProps;
  columns?: CargoColumnDef[];
  ariaLabel?: string;
  showActions?: boolean;
  sortColumn?: CargoSortColumnKey | null;
  sortDirection?: CargoSortDirection;
  onSortColumn?: (column: CargoSortColumnKey) => void;
  enableSorting?: boolean;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoTable({
  children,
  footer,
  pagination,
  columns: columnsOverride,
  ariaLabel = 'Listado de cargos',
  showActions = true,
  sortColumn = null,
  sortDirection = 'asc',
  onSortColumn,
  enableSorting = true,
  theme = 'dark',
  size = 'md',
  className,
}: CargoTableProps): JSX.Element {
  const headerColumns =
    columnsOverride ??
    (enableSorting
      ? buildCargoHeaderColumns(showActions, sortColumn, sortDirection, onSortColumn)
      : getCargoColumns(showActions).map((column) => ({ ...column, sortable: false })));
  const gridTemplate = getGridTemplateFromColumns(headerColumns);
  const tableMinWidthPx = getTableMinWidthPxFromColumns(headerColumns);

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label={ariaLabel}
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
            columns={headerColumns}
            theme={theme}
            size={size}
            className={styles.desktopHeader}
          />
          <CargoTableGridTemplateProvider value={gridTemplate}>
            <div className={styles.body} role="rowgroup">
              {children}
            </div>
          </CargoTableGridTemplateProvider>
        </div>
      </div>
      {footer ??
        (pagination ? <CargoPagination theme={theme} size={size} {...pagination} /> : null)}
    </section>
  );
}

export default CargoTable;
