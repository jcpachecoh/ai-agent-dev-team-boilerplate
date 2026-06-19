import { Copy, Pencil, Shield, UserX } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolRowActionButton.module.scss';

export type RolRowActionVariant = 'permissions' | 'edit' | 'deactivate' | 'duplicate';

export interface RolRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: RolRowActionVariant;
  icon?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
}

const defaultIcons: Record<RolRowActionVariant, ReactNode> = {
  permissions: <Shield aria-hidden />,
  edit: <Pencil aria-hidden />,
  deactivate: <UserX aria-hidden />,
  duplicate: <Copy aria-hidden />,
};

const defaultLabels: Record<RolRowActionVariant, string> = {
  permissions: 'Ver permisos',
  edit: 'Editar rol',
  deactivate: 'Desactivar rol',
  duplicate: 'Duplicar rol',
};

export function RolRowActionButton({
  variant = 'edit',
  icon,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: RolRowActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel ?? defaultLabels[variant]}
      {...props}
    >
      <span className={styles.icon}>{icon ?? defaultIcons[variant]}</span>
    </button>
  );
}

export default RolRowActionButton;
