import { AlertTriangle } from 'lucide-react';
import React, { type CSSProperties, type JSX } from 'react';

import { InventarioIconButton } from '../inventario-icon-button';
import { InventarioStatusBadge } from '../inventario-status-badge';
import {
  inventarioAlertGridTemplate,
  inventarioMovementGridTemplate,
  inventarioProductGridTemplate,
} from '../shared/inventario-columns';
import type {
  InventarioMovementType,
  InventarioSeverity,
  InventarioSize,
  InventarioStockTone,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioTableRow.module.scss';

export type InventarioTableRowVariant = 'product' | 'movement' | 'alert';

export interface InventarioTableRowProductProps {
  variant?: 'product';
  sku?: string;
  name?: string;
  category?: string;
  supplier?: string;
  stockTotal?: string | number;
  unitPrice?: string;
  lastMovement?: string;
  stockTone?: InventarioStockTone;
  lowStockWarning?: boolean;
  onSkuClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface InventarioTableRowMovementProps {
  variant: 'movement';
  date?: string;
  product?: string;
  movementType?: InventarioMovementType;
  quantity?: string;
  user?: string;
  reference?: string;
}

export interface InventarioTableRowAlertProps {
  variant: 'alert';
  severity?: InventarioSeverity;
  product?: string;
  currentStock?: string | number;
  minStock?: string | number;
  supplier?: string;
  onOrder?: () => void;
  onResolve?: () => void;
}

export type InventarioTableRowProps = (
  | InventarioTableRowProductProps
  | InventarioTableRowMovementProps
  | InventarioTableRowAlertProps
) & {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
};

const gridByVariant = {
  product: inventarioProductGridTemplate,
  movement: inventarioMovementGridTemplate,
  alert: inventarioAlertGridTemplate,
} as const;

export function InventarioTableRow(props: InventarioTableRowProps): JSX.Element {
  const { theme = 'light', size = 'xl', className } = props;
  const variant = props.variant ?? 'product';

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--inventario-columns': gridByVariant[variant] } as CSSProperties}
    >
      {variant === 'product' ? (
        <ProductCells {...(props as InventarioTableRowProductProps)} theme={theme} />
      ) : null}
      {variant === 'movement' ? (
        <MovementCells {...(props as InventarioTableRowMovementProps)} theme={theme} />
      ) : null}
      {variant === 'alert' ? (
        <AlertCells {...(props as InventarioTableRowAlertProps)} theme={theme} />
      ) : null}
    </div>
  );
}

function ProductCells({
  sku = 'SKU-001',
  name = 'Pollo Entero',
  category = 'Proteínas',
  supplier = 'Carnes del Valle',
  stockTotal = 850,
  unitPrice = '$12.500',
  lastMovement = '2024-05-28',
  stockTone = 'success',
  lowStockWarning = false,
  onSkuClick,
  onEdit,
  onDelete,
  theme = 'light',
}: InventarioTableRowProductProps & { theme: InventarioTheme }): JSX.Element {
  return (
    <>
      <span className={styles.sku} role="cell">
        {onSkuClick ? (
          <button type="button" className={styles.skuLink} onClick={onSkuClick}>
            {sku}
          </button>
        ) : (
          sku
        )}
      </span>
      <span className={styles.name} role="cell">
        {name}
        {lowStockWarning ? (
          <AlertTriangle className={styles.warningIcon} aria-label="Stock bajo" />
        ) : null}
      </span>
      <span className={styles.muted} role="cell">
        {category}
      </span>
      <span className={styles.muted} role="cell">
        {supplier}
      </span>
      <span className={[styles.stock, styles[`stock--${stockTone}`]].join(' ')} role="cell">
        {stockTotal}
      </span>
      <span className={styles.price} role="cell">
        {unitPrice}
      </span>
      <span className={styles.muted} role="cell">
        {lastMovement}
      </span>
      <span className={styles.actions} role="cell">
        <InventarioIconButton variant="edit" theme={theme} onClick={onEdit} />
        <InventarioIconButton variant="delete" theme={theme} onClick={onDelete} />
      </span>
    </>
  );
}

function MovementCells({
  date = '2024-05-28',
  product = 'Pollo Entero',
  movementType = 'entrada',
  quantity = '+120',
  user = 'J. Pérez',
  reference = 'OC-4521',
  theme = 'light',
}: InventarioTableRowMovementProps & { theme: InventarioTheme }): JSX.Element {
  return (
    <>
      <span className={styles.muted} role="cell">
        {date}
      </span>
      <span className={styles.name} role="cell">
        {product}
      </span>
      <span className={styles.badgeCell} role="cell">
        <InventarioStatusBadge domain="movement" status={movementType} theme={theme} size="sm" />
      </span>
      <span className={styles.quantity} role="cell">
        {quantity}
      </span>
      <span className={styles.muted} role="cell">
        {user}
      </span>
      <span className={styles.muted} role="cell">
        {reference}
      </span>
    </>
  );
}

function AlertCells({
  severity = 'critical',
  product = 'Cilantro Fresco',
  currentStock = 12,
  minStock = 50,
  supplier = 'Verduras Andinas',
  onOrder,
  onResolve,
  theme = 'light',
}: InventarioTableRowAlertProps & { theme: InventarioTheme }): JSX.Element {
  return (
    <>
      <span className={styles.badgeCell} role="cell">
        <InventarioStatusBadge domain="severity" status={severity} theme={theme} size="sm" />
      </span>
      <span className={styles.name} role="cell">
        {product}
      </span>
      <span className={[styles.stock, styles['stock--danger']].join(' ')} role="cell">
        {currentStock}
      </span>
      <span className={styles.muted} role="cell">
        {minStock}
      </span>
      <span className={styles.muted} role="cell">
        {supplier}
      </span>
      <span className={styles.actions} role="cell">
        <InventarioIconButton variant="order" theme={theme} onClick={onOrder} />
        <InventarioIconButton variant="resolve" theme={theme} onClick={onResolve} />
      </span>
    </>
  );
}

export default InventarioTableRow;
