import { Table2 } from 'lucide-react';
import React, { type CSSProperties, type JSX } from 'react';

import { inventarioReportGridTemplate } from '../shared/inventario-columns';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioReportDataTable.module.scss';

export interface InventarioReportDataRow {
  category: string;
  quantity: string | number;
  percent: string;
}

export interface InventarioReportDataTableProps {
  title?: string;
  rows?: InventarioReportDataRow[];
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const defaultRows: InventarioReportDataRow[] = [
  { category: 'Carnes', quantity: '1670', percent: '35%' },
  { category: 'Granos', quantity: '1200', percent: '25%' },
  { category: 'Tubérculos', quantity: '950', percent: '20%' },
  { category: 'Aceites', quantity: '600', percent: '12%' },
  { category: 'Vegetales', quantity: '380', percent: '8%' },
];

export function InventarioReportDataTable({
  title = 'Datos del Reporte',
  rows = defaultRows,
  theme = 'light',
  size = 'xl',
  className,
}: InventarioReportDataTableProps): JSX.Element {
  const gridStyle = { '--inventario-columns': inventarioReportGridTemplate } as CSSProperties;

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <Table2 className={styles.headerIcon} aria-hidden />
        <h3 className={styles.title}>{title}</h3>
      </header>
      <div className={styles.body}>
        <div className={[styles.row, styles.headerRow].join(' ')} style={gridStyle} role="row">
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Cantidad</span>
          <span role="columnheader">%</span>
        </div>
        {rows.map((row) => (
          <div key={row.category} className={styles.row} style={gridStyle} role="row">
            <span className={styles.category} role="cell">
              {row.category}
            </span>
            <span className={styles.quantity} role="cell">
              {row.quantity}
            </span>
            <span className={styles.percent} role="cell">
              {row.percent}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default InventarioReportDataTable;
