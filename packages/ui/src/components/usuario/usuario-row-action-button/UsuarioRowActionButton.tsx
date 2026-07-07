import { Pencil, UserX } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioRowActionButton.module.scss';

export type UsuarioRowActionVariant = 'edit' | 'deactivate';

export interface UsuarioRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: UsuarioRowActionVariant;
  icon?: ReactNode;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
}

const defaultIcons: Record<UsuarioRowActionVariant, ReactNode> = {
  edit: <Pencil aria-hidden />,
  deactivate: <UserX aria-hidden />,
};

export function UsuarioRowActionButton({
  variant = 'edit',
  icon,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: UsuarioRowActionButtonProps): JSX.Element {
  const resolvedAriaLabel =
    ariaLabel ?? (variant === 'edit' ? 'Editar usuario' : 'Desactivar usuario');

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
      aria-label={resolvedAriaLabel}
      {...props}
    >
      <span className={styles.icon}>{icon ?? defaultIcons[variant]}</span>
    </button>
  );
}

export default UsuarioRowActionButton;
