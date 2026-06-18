import type { JSX } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolStatusBadge.module.scss';

export interface RolStatusBadgeProps {
  active?: boolean;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: RolStatusBadgeProps): JSX.Element {
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
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default RolStatusBadge;
