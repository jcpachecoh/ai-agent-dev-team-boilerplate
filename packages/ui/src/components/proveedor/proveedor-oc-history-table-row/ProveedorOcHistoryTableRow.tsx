import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorRowActionButton } from '../proveedor-row-action-button/ProveedorRowActionButton';
import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import { ocHistoryGridTemplate } from '../shared/proveedor-detail-columns';
import type {
  ProveedorOcHistoryStatus,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorOcHistoryTableRow.module.scss';

export interface ProveedorOcHistoryTableRowProps {
  orderId?: string;
  date?: string;
  items?: number | string;
  total?: string;
  deliveryDate?: string;
  status?: ProveedorOcHistoryStatus;
  onView?: () => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorOcHistoryTableRow({
  orderId = 'OC-2024-0156',
  date = '2024-05-28',
  items = 12,
  total = '$8.750.000',
  deliveryDate = '2024-05-28',
  status = 'delivered',
  onView,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorOcHistoryTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': ocHistoryGridTemplate } as CSSProperties}
    >
      <span className={styles.primary} role="cell">
        {orderId}
      </span>
      <span className={styles.muted} role="cell">
        {date}
      </span>
      <span className={styles.muted} role="cell">
        {items}
      </span>
      <span className={styles.amount} role="cell">
        {total}
      </span>
      <span className={styles.muted} role="cell">
        {deliveryDate}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="oc-history" status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.actions} role="cell">
        <ProveedorRowActionButton variant="view" theme={theme} size="sm" onClick={onView} />
      </span>
    </div>
  );
}

export default ProveedorOcHistoryTableRow;
