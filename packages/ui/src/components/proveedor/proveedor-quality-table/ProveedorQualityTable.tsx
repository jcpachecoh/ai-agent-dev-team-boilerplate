import React, { type JSX } from 'react';

import { ProveedorTableHeader, type ProveedorTableColumn } from '../proveedor-table-header';
import {
  ProveedorQualityTableRow,
  type ProveedorQualityTableRowProps,
} from '../proveedor-quality-table-row/ProveedorQualityTableRow';
import { qualityColumns } from '../shared/proveedor-detail-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from '../proveedor-suppliers-table/ProveedorSuppliersTable.module.scss';

export interface ProveedorQualityTableProps {
  rows: ProveedorQualityTableRowProps[];
  columns?: ProveedorTableColumn[];
  onReportRow?: (date: string) => void;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorQualityTable({
  rows,
  columns = qualityColumns,
  onReportRow,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorQualityTableProps): JSX.Element {
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
            {emptyState ?? <span>Sin registros de calidad</span>}
          </div>
        ) : (
          rows.map((row) => (
            <ProveedorQualityTableRow
              key={`${row.date}-${row.type}`}
              {...row}
              theme={theme}
              size={size}
              onReport={
                onReportRow && row.date ? () => onReportRow(row.date as string) : row.onReport
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProveedorQualityTable;
