import type { JSX } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoStatusBadge.module.scss';

export interface EmpleadoStatusBadgeProps {
  active?: boolean;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: EmpleadoStatusBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        active ? styles.active : styles.inactive,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.dot} aria-hidden />
      {active ? 'ACTIVO' : 'INACTIVO'}
    </span>
  );
}

export default EmpleadoStatusBadge;
