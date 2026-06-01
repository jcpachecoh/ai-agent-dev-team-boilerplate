import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorStatusBadge } from '../proveedor-status-badge';
import { supplierGridTemplate } from '../shared/proveedor-columns';
import type {
  ProveedorSize,
  ProveedorSupplierStatus,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorTableRow.module.scss';

export interface ProveedorTableRowProps {
  supplierId?: string;
  name?: string;
  category?: string;
  status?: ProveedorSupplierStatus;
  paymentTerms?: string;
  leadTime?: string;
  reliability?: string;
  productCount?: number | string;
  balance?: string;
  lastPurchaseOrder?: string;
  onClick?: () => void;
  selected?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorTableRow({
  supplierId = 'SUP-001',
  name = 'Carnes del Valle S.A.S',
  category = 'Proteínas',
  status = 'active',
  paymentTerms = '30 días',
  leadTime = '24h',
  reliability = '4.8 ★',
  productCount = 45,
  balance = '$2.450.000',
  lastPurchaseOrder = '2024-05-20',
  onClick,
  selected = false,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorTableRowProps): JSX.Element {
  const handleClick = () => onClick?.();
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={[
        styles.row,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        selected && styles.selected,
        onClick && styles.clickable,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': supplierGridTemplate } as CSSProperties}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className={styles.id} role="cell">
        {supplierId}
      </span>
      <span className={styles.name} role="cell">
        {name}
      </span>
      <span className={styles.category} role="cell">
        {category}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="supplier" status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.muted} role="cell">
        {paymentTerms}
      </span>
      <span className={styles.muted} role="cell">
        {leadTime}
      </span>
      <span className={styles.reliability} role="cell">
        {reliability}
      </span>
      <span className={styles.muted} role="cell">
        {productCount}
      </span>
      <span className={styles.balance} role="cell">
        {balance}
      </span>
      <span className={styles.muted} role="cell">
        {lastPurchaseOrder}
      </span>
    </div>
  );
}

export default ProveedorTableRow;
