import React, { type JSX } from 'react';

import {
  ProveedorCatalogTableHeader,
  type ProveedorCatalogColumn,
} from '../proveedor-catalog-table-header/ProveedorCatalogTableHeader';
import {
  ProveedorCatalogTableRow,
  type ProveedorCatalogTableRowProps,
} from '../proveedor-catalog-table-row/ProveedorCatalogTableRow';
import { defaultCatalogColumns } from '../shared/proveedor-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorCatalogTable.module.scss';

export interface ProveedorCatalogTableProps {
  rows: ProveedorCatalogTableRowProps[];
  columns?: ProveedorCatalogColumn[];
  onEditRow?: (sku: string) => void;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorCatalogTable({
  rows,
  columns = defaultCatalogColumns,
  onEditRow,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorCatalogTableProps): JSX.Element {
  return (
    <div
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
    >
      <ProveedorCatalogTableHeader columns={columns} theme={theme} size={size} />
      <div className={styles.body} role="rowgroup">
        {rows.length === 0 ? (
          <div className={styles.empty} role="row">
            {emptyState ?? <span>Sin productos</span>}
          </div>
        ) : (
          rows.map((row) => (
            <ProveedorCatalogTableRow
              key={row.sku}
              {...row}
              theme={theme}
              size={size}
              onEdit={onEditRow && row.sku ? () => onEditRow(row.sku as string) : row.onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProveedorCatalogTable;
