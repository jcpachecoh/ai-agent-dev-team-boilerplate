import React, { type JSX } from 'react';

import { ProveedorTableHeader, type ProveedorTableColumn } from '../proveedor-table-header';
import {
  ProveedorOcHistoryTableRow,
  type ProveedorOcHistoryTableRowProps,
} from '../proveedor-oc-history-table-row/ProveedorOcHistoryTableRow';
import { ocHistoryColumns } from '../shared/proveedor-detail-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from '../proveedor-suppliers-table/ProveedorSuppliersTable.module.scss';

export interface ProveedorOcHistoryTableProps {
  rows: ProveedorOcHistoryTableRowProps[];
  columns?: ProveedorTableColumn[];
  onViewRow?: (orderId: string) => void;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorOcHistoryTable({
  rows,
  columns = ocHistoryColumns,
  onViewRow,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorOcHistoryTableProps): JSX.Element {
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
            {emptyState ?? <span>Sin órdenes de compra</span>}
          </div>
        ) : (
          rows.map((row) => (
            <ProveedorOcHistoryTableRow
              key={row.orderId}
              {...row}
              theme={theme}
              size={size}
              onView={
                onViewRow && row.orderId ? () => onViewRow(row.orderId as string) : row.onView
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProveedorOcHistoryTable;
