import React, { type JSX } from 'react';

import {
  ProveedorTableHeader,
  type ProveedorTableColumn,
} from '../proveedor-table-header/ProveedorTableHeader';
import {
  ProveedorTableRow,
  type ProveedorTableRowProps,
} from '../proveedor-table-row/ProveedorTableRow';
import { defaultSupplierColumns } from '../shared/proveedor-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorSuppliersTable.module.scss';

export interface ProveedorSuppliersTableProps {
  rows: ProveedorTableRowProps[];
  columns?: ProveedorTableColumn[];
  onRowClick?: (supplierId: string) => void;
  selectedSupplierId?: string;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorSuppliersTable({
  rows,
  columns = defaultSupplierColumns,
  onRowClick,
  selectedSupplierId,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorSuppliersTableProps): JSX.Element {
  return (
    <div
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
    >
      <ProveedorTableHeader columns={columns} theme={theme} size={size} />
      <div className={styles.body} role="rowgroup">
        {rows.length === 0 ? (
          <div className={styles.empty} role="row">
            {emptyState ?? <span>Sin proveedores</span>}
          </div>
        ) : (
          rows.map((row) => (
            <ProveedorTableRow
              key={row.supplierId}
              {...row}
              theme={theme}
              size={size}
              selected={row.supplierId === selectedSupplierId}
              onClick={
                onRowClick && row.supplierId
                  ? () => onRowClick(row.supplierId as string)
                  : row.onClick
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProveedorSuppliersTable;
