import React, { type JSX } from 'react';

import styles from './ProduccionStatusBadge.module.scss';
import type { ProduccionSize, ProduccionStatus, ProduccionTheme } from '../shared/produccion-types';

const labels: Record<ProduccionStatus, string> = {
  active: 'ACTIVA',
  inactive: 'INACTIVA',
  maintenance: 'MANTENIMIENTO',
  published: 'PUBLICADA',
  draft: 'BORRADOR',
  archived: 'ARCHIVADA',
};

export interface ProduccionStatusBadgeProps {
  status?: ProduccionStatus;
  label?: string;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionStatusBadge({
  status = 'active',
  label,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionStatusBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {label ?? labels[status]}
    </span>
  );
}

export default ProduccionStatusBadge;
