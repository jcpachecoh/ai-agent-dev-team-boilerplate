import React, { type JSX } from 'react';

import { ProveedorTableHeader, type ProveedorTableColumn } from '../proveedor-table-header';
import {
  ProveedorDocumentationTableRow,
  type ProveedorDocumentationTableRowProps,
} from '../proveedor-documentation-table-row/ProveedorDocumentationTableRow';
import { documentationColumns } from '../shared/proveedor-detail-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorDocumentationTable.module.scss';

export interface ProveedorDocumentationTableProps {
  rows: ProveedorDocumentationTableRowProps[];
  columns?: ProveedorTableColumn[];
  completenessLabel?: string;
  emptyState?: React.ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorDocumentationTable({
  rows,
  columns = documentationColumns,
  completenessLabel,
  emptyState,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorDocumentationTableProps): JSX.Element {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {completenessLabel ? <p className={styles.completeness}>{completenessLabel}</p> : null}
      <div
        className={[styles.tableShell, styles[`theme--${theme}`], styles[`size--${size}`]]
          .filter(Boolean)
          .join(' ')}
        role="table"
      >
        <ProveedorTableHeader columns={columns} theme={theme} size={size} />
        <div className={styles.tableBody} role="rowgroup">
          {rows.length === 0 ? (
            <div className={styles.empty} role="row">
              {emptyState ?? <span>Sin documentos configurados</span>}
            </div>
          ) : (
            rows.map((row) => (
              <ProveedorDocumentationTableRow
                key={row.documentLabel}
                {...row}
                theme={theme}
                size={size}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProveedorDocumentationTable;
