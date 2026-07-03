import type { JSX } from 'react';

import type { UsuarioRoleVariant } from '../shared/usuario-types';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioRoleBadge.module.scss';

export interface UsuarioRoleBadgeProps {
  label?: string;
  variant?: UsuarioRoleVariant;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioRoleBadge({
  label = 'Propietario',
  variant = 'default',
  theme = 'dark',
  size = 'sm',
  className,
}: UsuarioRoleBadgeProps): JSX.Element {
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

export default UsuarioRoleBadge;
