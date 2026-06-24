import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';

import styles from './StatusBadge.module.scss';

export type StatusType =
  | 'PENDING'
  | 'SUCCESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ERROR'
  | 'CANCELLED'
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED'
  | 'WARNING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'OK'
  | 'LOW'
  | 'CRITICAL';

export interface StatusBadgeProps {
  status: StatusType;
  variant?: 'dot' | 'pill';
  animated?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
}

const statusMap: Record<StatusType, { color: string; label: string }> = {
  PENDING: { color: 'yellow', label: 'Pendiente' },
  SUCCESS: { color: 'green', label: 'Éxito' },
  COMPLETED: { color: 'green', label: 'Completado' },
  FAILED: { color: 'red', label: 'Fallido' },
  ERROR: { color: 'red', label: 'Error' },
  CANCELLED: { color: 'red', label: 'Cancelado' },
  DRAFT: { color: 'gray', label: 'Borrador' },
  ACTIVE: { color: 'green', label: 'Activo' },
  INACTIVE: { color: 'gray', label: 'Inactivo' },
  ARCHIVED: { color: 'gray', label: 'Archivado' },
  WARNING: { color: 'yellow', label: 'Advertencia' },
  PROCESSING: { color: 'blue', label: 'Procesando' },
  APPROVED: { color: 'green', label: 'Aprobado' },
  REJECTED: { color: 'red', label: 'Rechazado' },
  OK: { color: 'green', label: 'Ok' },
  LOW: { color: 'yellow', label: 'Bajo' },
  CRITICAL: { color: 'red', label: 'Crítico' },
};

export function StatusBadge({
  status,
  variant = 'pill',
  animated = false,
  className,
  theme = 'dark',
  size = 'md',
}: StatusBadgeProps): JSX.Element {
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    return (
      <ActiveInactiveStatusBadge
        active={status === 'ACTIVE'}
        theme={theme}
        size={size === 'sm' ? 'sm' : 'md'}
        className={className}
      />
    );
  }

  const config = statusMap[status] || { color: 'gray', label: status };
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div
      className={[
        styles.badge,
        styles[variant],
        styles[config.color],
        sizeClass,
        themeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={[styles.dot, animated && styles.animated].filter(Boolean).join(' ')} />
      {variant === 'pill' && <span className={styles.label}>{config.label}</span>}
    </div>
  );
}

export default StatusBadge;
