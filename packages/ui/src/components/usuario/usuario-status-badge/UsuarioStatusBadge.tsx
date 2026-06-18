import type { JSX } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioStatusBadge.module.scss';

export interface UsuarioStatusBadgeProps {
  active?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: UsuarioStatusBadgeProps): JSX.Element {
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
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default UsuarioStatusBadge;
