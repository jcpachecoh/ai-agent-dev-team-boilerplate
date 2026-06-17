import type { JSX } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoContractBadge.module.scss';

export interface EmpleadoContractBadgeProps {
  label?: string;
  variant?: 'indefinido' | 'servicios' | 'default';
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoContractBadge({
  label = 'INDEFINIDO',
  variant = 'default',
  theme = 'dark',
  size = 'sm',
  className,
}: EmpleadoContractBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}

export default EmpleadoContractBadge;
