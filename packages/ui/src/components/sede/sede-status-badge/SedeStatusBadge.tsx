import { Check, Circle } from 'lucide-react';
import React, { type JSX } from 'react';

import type { SedeLocationStatus, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeStatusBadge.module.scss';

export interface SedeStatusBadgeProps {
  status?: SedeLocationStatus;
  label?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

const defaultLabels: Record<SedeLocationStatus, string> = {
  active: 'ACTIVO',
  inactive: 'INACTIVO',
};

export function SedeStatusBadge({
  status = 'active',
  label,
  theme = 'dark',
  size = 'md',
  className,
}: SedeStatusBadgeProps): JSX.Element {
  const resolvedLabel = label ?? defaultLabels[status];

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
      {status === 'active' ? <Check aria-hidden /> : <Circle aria-hidden />}
      <span>{resolvedLabel}</span>
    </span>
  );
}

export default SedeStatusBadge;
