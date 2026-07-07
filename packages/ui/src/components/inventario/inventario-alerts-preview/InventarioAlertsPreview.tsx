import React, { type JSX } from 'react';

import { InventarioFilterToolbar } from '../inventario-filter-toolbar';
import { InventarioPageToolbar } from '../inventario-page-toolbar';
import { InventarioPagination } from '../inventario-pagination';
import { InventarioTableHeader } from '../inventario-table-header';
import { InventarioTableRow } from '../inventario-table-row';
import { InventarioTopBar } from '../inventario-top-bar';
import type {
  InventarioSeverity,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioAlertsPreview.module.scss';

export interface InventarioAlertsPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const sampleAlerts: {
  severity: InventarioSeverity;
  product: string;
  currentStock: number;
  minStock: number;
}[] = [
  { severity: 'critical', product: 'Cilantro Fresco', currentStock: 12, minStock: 50 },
  { severity: 'warning', product: 'Tomate Chonto', currentStock: 28, minStock: 40 },
  { severity: 'resolved', product: 'Aceite Vegetal', currentStock: 95, minStock: 30 },
];

export function InventarioAlertsPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioAlertsPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioTopBar theme={theme} size={size} />
      <div className={styles.content}>
        <InventarioPageToolbar
          title="Alertas de Stock Bajo"
          subtitle="Productos por debajo del stock mínimo configurado"
          actionLabel="EXPORTAR ALERTAS"
          theme={theme}
          size={size}
        />
        <InventarioFilterToolbar
          theme={theme}
          size={size}
          lowStockOnly
          lowStockLabel="Solo críticas"
        />
        <div className={styles.table}>
          <InventarioTableHeader variant="alert" theme={theme} size="xl" />
          {sampleAlerts.map((row) => (
            <InventarioTableRow
              key={row.product}
              variant="alert"
              theme={theme}
              size="xl"
              {...row}
            />
          ))}
        </div>
        <InventarioPagination theme={theme} size={size} />
      </div>
    </div>
  );
}

export default InventarioAlertsPreview;
