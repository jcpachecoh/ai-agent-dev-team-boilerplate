import { Check, Circle } from 'lucide-react';
import type { JSX } from 'react';

import styles from './ActiveInactiveStatusBadge.module.scss';

export type ActiveInactiveStatus = 'active' | 'inactive';
export type ActiveInactiveStatusBadgeTheme = 'light' | 'dark';
export type ActiveInactiveStatusBadgeSize = 'sm' | 'md';

export interface ActiveInactiveStatusBadgeProps {
  status?: ActiveInactiveStatus;
  active?: boolean;
  label?: string;
  theme?: ActiveInactiveStatusBadgeTheme;
  size?: ActiveInactiveStatusBadgeSize;
  className?: string;
}

const defaultLabels: Record<ActiveInactiveStatus, string> = {
  active: 'ACTIVO',
  inactive: 'INACTIVO',
};

export function ActiveInactiveStatusBadge({
  status,
  active,
  label,
  theme = 'dark',
  size = 'md',
  className,
}: ActiveInactiveStatusBadgeProps): JSX.Element {
  const resolvedStatus: ActiveInactiveStatus = status ?? (active === false ? 'inactive' : 'active');
  const resolvedLabel = label ?? defaultLabels[resolvedStatus];

  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        size === 'sm' ? styles['size--sm'] : null,
        styles[`status--${resolvedStatus}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {resolvedStatus === 'active' ? <Check aria-hidden /> : <Circle aria-hidden />}
      <span>{resolvedLabel}</span>
    </span>
  );
}

export default ActiveInactiveStatusBadge;
