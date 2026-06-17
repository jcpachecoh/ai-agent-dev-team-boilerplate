import React, { type JSX } from 'react';

import { ProveedorTableHeader, type ProveedorTableColumn } from '../proveedor-table-header';
import {
  ProveedorPayableTableRow,
  type ProveedorPayableTableRowProps,
} from '../proveedor-payable-table-row/ProveedorPayableTableRow';
import { payableColumns } from '../shared/proveedor-detail-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from '../proveedor-suppliers-table/ProveedorSuppliersTable.module.scss';

export interface ProveedorPayableTableProps {
  rows: ProveedorPayableTableRowProps[];
  columns?: ProveedorTableColumn[];
  onPdfRow?: (invoiceId: string) => void;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorPayableTable({
  rows,
  columns = payableColumns,
  onPdfRow,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorPayableTableProps): JSX.Element {
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
            {emptyState ?? <span>Sin facturas pendientes</span>}
          </div>
        ) : (
          rows.map((row) => (
            <ProveedorPayableTableRow
              key={row.invoiceId}
              {...row}
              theme={theme}
              size={size}
              onPdf={
                onPdfRow && row.invoiceId ? () => onPdfRow(row.invoiceId as string) : row.onPdf
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProveedorPayableTable;
