import React, { type JSX } from 'react';

import type {
  InventarioMovementType,
  InventarioSeverity,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioStatusBadge.module.scss';

export type InventarioStatusBadgeDomain = 'movement' | 'severity';

export type InventarioStatusBadgeStatus = InventarioMovementType | InventarioSeverity;

export interface InventarioStatusBadgeProps {
  domain?: InventarioStatusBadgeDomain;
  status?: InventarioStatusBadgeStatus;
  label?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const movementLabels: Record<InventarioMovementType, string> = {
  entrada: 'ENTRADA',
  salida: 'SALIDA',
  consumo: 'CONSUMO',
  ajuste: 'AJUSTE',
};

const severityLabels: Record<InventarioSeverity, string> = {
  critical: 'CRÍTICO',
  warning: 'ADVERTENCIA',
  resolved: 'RESUELTO',
};

export function InventarioStatusBadge({
  domain = 'movement',
  status = 'entrada',
  label,
  theme = 'light',
  size = 'md',
  className,
}: InventarioStatusBadgeProps): JSX.Element {
  const resolvedLabel =
    label ??
    (domain === 'severity'
      ? severityLabels[status as InventarioSeverity]
      : movementLabels[status as InventarioMovementType]);

  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`domain--${domain}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {resolvedLabel}
    </span>
  );
}

export default InventarioStatusBadge;
