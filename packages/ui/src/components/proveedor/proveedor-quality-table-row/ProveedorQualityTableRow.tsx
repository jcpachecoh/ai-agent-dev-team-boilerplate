import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorRowActionButton } from '../proveedor-row-action-button/ProveedorRowActionButton';
import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import { qualityGridTemplate } from '../shared/proveedor-detail-columns';
import type {
  ProveedorQualityComplianceStatus,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorQualityTableRow.module.scss';

export interface ProveedorQualityTableRowProps {
  date?: string;
  type?: string;
  score?: number | string;
  scoreTone?: 'high' | 'medium' | 'low';
  defects?: number | string;
  inspector?: string;
  compliance?: ProveedorQualityComplianceStatus;
  onReport?: () => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorQualityTableRow({
  date = '2024-05-28',
  type = 'Inspección Recepción',
  score = 98,
  scoreTone = 'high',
  defects = 0,
  inspector = 'J. Martínez',
  compliance = 'conform',
  onReport,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorQualityTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': qualityGridTemplate } as CSSProperties}
    >
      <span className={styles.muted} role="cell">
        {date}
      </span>
      <span className={styles.type} role="cell">
        {type}
      </span>
      <span
        className={[
          styles.score,
          scoreTone === 'high' && styles.scoreHigh,
          scoreTone === 'medium' && styles.scoreMedium,
          scoreTone === 'low' && styles.scoreLow,
        ]
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        {score}
      </span>
      <span
        className={[styles.defects, Number(defects) > 0 && styles.defectsWarning]
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        {defects}
      </span>
      <span className={styles.muted} role="cell">
        {inspector}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="quality" status={compliance} theme={theme} size="sm" />
      </span>
      <span className={styles.actions} role="cell">
        <ProveedorRowActionButton variant="report" theme={theme} size="sm" onClick={onReport} />
      </span>
    </div>
  );
}

export default ProveedorQualityTableRow;
