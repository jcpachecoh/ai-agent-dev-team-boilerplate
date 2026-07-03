import React, { type JSX } from 'react';

import { InventarioFilterToolbar } from '../inventario-filter-toolbar';
import { InventarioPageToolbar } from '../inventario-page-toolbar';
import { InventarioPagination } from '../inventario-pagination';
import { InventarioTableHeader } from '../inventario-table-header';
import { InventarioTableRow } from '../inventario-table-row';
import { InventarioTopBar } from '../inventario-top-bar';
import type {
  InventarioMovementType,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioMovementsPreview.module.scss';

export interface InventarioMovementsPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const sampleMovements: {
  date: string;
  product: string;
  movementType: InventarioMovementType;
  quantity: string;
}[] = [
  { date: '2024-05-28', product: 'Pollo Entero', movementType: 'entrada', quantity: '+120' },
  { date: '2024-05-28', product: 'Arroz Blanco', movementType: 'consumo', quantity: '-45' },
  { date: '2024-05-27', product: 'Aceite Vegetal', movementType: 'ajuste', quantity: '+8' },
];

export function InventarioMovementsPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioMovementsPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioTopBar theme={theme} size={size} />
      <div className={styles.content}>
        <InventarioPageToolbar
          title="Movimientos de Stock"
          subtitle="Historial de entradas, salidas y ajustes"
          actionLabel="EXPORTAR"
          theme={theme}
          size={size}
        />
        <InventarioFilterToolbar theme={theme} size={size} lowStockLabel="Solo hoy" />
        <div className={styles.table}>
          <InventarioTableHeader variant="movement" theme={theme} size="xl" />
          {sampleMovements.map((row) => (
            <InventarioTableRow
              key={`${row.date}-${row.product}`}
              variant="movement"
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

export default InventarioMovementsPreview;
