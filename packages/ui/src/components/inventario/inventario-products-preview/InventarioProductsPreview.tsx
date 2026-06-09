import React, { type JSX } from 'react';

import { InventarioFilterToolbar } from '../inventario-filter-toolbar';
import { InventarioPageToolbar } from '../inventario-page-toolbar';
import { InventarioPagination } from '../inventario-pagination';
import { InventarioTableHeader } from '../inventario-table-header';
import { InventarioTableRow } from '../inventario-table-row';
import { InventarioTopBar } from '../inventario-top-bar';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioProductsPreview.module.scss';

export interface InventarioProductsPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const sampleRows = [
  {
    sku: 'POLLO-001',
    name: 'POLLO ENTERO',
    category: 'Carnes',
    supplier: 'Agrosuper',
    stockTotal: '850',
    unitPrice: '$12,000',
    lastMovement: '2026-05-29',
    stockTone: 'success' as const,
  },
  {
    sku: 'CARNE-002',
    name: 'CARNE MOLIDA',
    category: 'Carnes',
    supplier: 'Frigorífico del Llano',
    stockTotal: '620',
    unitPrice: '$22,000',
    lastMovement: '2026-05-28',
    stockTone: 'success' as const,
  },
  {
    sku: 'PAPA-005',
    name: 'PAPA CRIOLLA',
    category: 'Tubérculos',
    supplier: 'Agro Boyacá',
    stockTotal: '120',
    unitPrice: '$4,000',
    lastMovement: '2026-05-26',
    stockTone: 'danger' as const,
    lowStockWarning: true,
  },
];

export function InventarioProductsPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioProductsPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioTopBar theme={theme} size={size} />
      <div className={styles.content}>
        <InventarioPageToolbar theme={theme} size={size} />
        <InventarioFilterToolbar theme={theme} size={size} />
        <div className={styles.table}>
          <InventarioTableHeader variant="product" theme={theme} size="xl" />
          {sampleRows.map((row) => (
            <InventarioTableRow key={row.sku} variant="product" theme={theme} size="xl" {...row} />
          ))}
        </div>
        <InventarioPagination theme={theme} size={size} />
      </div>
    </div>
  );
}

export default InventarioProductsPreview;
