import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorCatalogEditButton } from '../proveedor-catalog-edit-button/ProveedorCatalogEditButton';
import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import { catalogGridTemplate } from '../shared/proveedor-columns';
import type {
  ProveedorCatalogStatus,
  ProveedorPriceTrend,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorCatalogTableRow.module.scss';

export interface ProveedorCatalogTableRowProps {
  productName?: string;
  sku?: string;
  unit?: string;
  currentPrice?: string;
  previousPrice?: string;
  moq?: string;
  status?: ProveedorCatalogStatus;
  priceTrend?: ProveedorPriceTrend;
  onEdit?: () => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorCatalogTableRow({
  productName = 'Lomo de Res Premium',
  sku = 'LRP-001',
  unit = 'Kg',
  currentPrice = '$28.500',
  previousPrice = '$27.800',
  moq = '5 kg',
  status = 'available',
  priceTrend = 'up',
  onEdit,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorCatalogTableRowProps): JSX.Element {
  const trendSuffix = priceTrend === 'up' ? '↑' : priceTrend === 'down' ? '↓' : '';

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': catalogGridTemplate } as CSSProperties}
    >
      <span className={styles.name} role="cell">
        {productName}
      </span>
      <span className={styles.muted} role="cell">
        {sku}
      </span>
      <span className={styles.muted} role="cell">
        {unit}
      </span>
      <span
        className={[
          styles.price,
          priceTrend === 'up' && styles.priceUp,
          priceTrend === 'down' && styles.priceDown,
        ]
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        {currentPrice}
        {trendSuffix}
      </span>
      <span className={styles.muted} role="cell">
        {previousPrice}
      </span>
      <span className={styles.muted} role="cell">
        {moq}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="catalog" status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.actions} role="cell">
        <ProveedorCatalogEditButton theme={theme} size="sm" onClick={onEdit} />
      </span>
    </div>
  );
}

export default ProveedorCatalogTableRow;
