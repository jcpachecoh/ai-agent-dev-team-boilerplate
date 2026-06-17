import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorRowActionButton } from '../proveedor-row-action-button/ProveedorRowActionButton';
import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import { payableGridTemplate } from '../shared/proveedor-detail-columns';
import type {
  ProveedorPayableStatus,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorPayableTableRow.module.scss';

export interface ProveedorPayableTableRowProps {
  invoiceId?: string;
  orderId?: string;
  date?: string;
  dueDate?: string;
  amount?: string;
  aging?: string;
  status?: ProveedorPayableStatus;
  onPdf?: () => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorPayableTableRow({
  invoiceId = 'FV-2024-0428',
  orderId = 'OC-2024-0156',
  date = '2024-05-28',
  dueDate = '2024-06-27',
  amount = '$8.750.000',
  aging = '4d',
  status = 'pending',
  onPdf,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorPayableTableRowProps): JSX.Element {
  const isOverdue = status === 'overdue';
  const isPaid = status === 'paid';

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': payableGridTemplate } as CSSProperties}
    >
      <span className={styles.primary} role="cell">
        {invoiceId}
      </span>
      <span className={styles.muted} role="cell">
        {orderId}
      </span>
      <span className={styles.muted} role="cell">
        {date}
      </span>
      <span
        className={[styles.muted, isOverdue && styles.dueOverdue].filter(Boolean).join(' ')}
        role="cell"
      >
        {dueDate}
      </span>
      <span
        className={[
          styles.amount,
          status === 'pending' && styles.amountPending,
          isPaid && styles.amountPaid,
          isOverdue && styles.amountOverdue,
        ]
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        {amount}
      </span>
      <span
        className={[
          styles.aging,
          status === 'pending' && styles.agingPending,
          isOverdue && styles.agingOverdue,
          isPaid && styles.agingPaid,
        ]
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        {aging}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="payable" status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.actions} role="cell">
        <ProveedorRowActionButton variant="pdf" theme={theme} size="sm" onClick={onPdf} />
      </span>
    </div>
  );
}

export default ProveedorPayableTableRow;
