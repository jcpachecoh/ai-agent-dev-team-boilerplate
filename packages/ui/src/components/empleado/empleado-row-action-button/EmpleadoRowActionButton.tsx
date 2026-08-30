import { Eye, History, Pencil, ToggleRight } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoRowActionButton.module.scss';

export type EmpleadoRowActionVariant = 'edit' | 'toggle' | 'view' | 'history';

export interface EmpleadoRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: EmpleadoRowActionVariant;
  active?: boolean;
  icon?: ReactNode;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
}

const defaultIcons: Record<EmpleadoRowActionVariant, ReactNode> = {
  edit: <Pencil aria-hidden />,
  toggle: <ToggleRight aria-hidden />,
  view: <Eye aria-hidden />,
  history: <History aria-hidden />,
};

export function EmpleadoRowActionButton({
  variant = 'edit',
  active = false,
  icon,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: EmpleadoRowActionButtonProps): JSX.Element {
  const resolvedAriaLabel =
    ariaLabel ??
    (variant === 'view'
      ? 'Ver perfil del empleado'
      : variant === 'edit'
        ? 'Editar empleado'
        : variant === 'history'
          ? 'Ver historial de cambios'
          : active
            ? 'Desactivar empleado'
            : 'Activar empleado');

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        variant === 'toggle' && active ? styles.toggleActive : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={resolvedAriaLabel}
      aria-pressed={variant === 'toggle' ? active : undefined}
      {...props}
    >
      <span className={styles.icon}>{icon ?? defaultIcons[variant]}</span>
    </button>
  );
}

export default EmpleadoRowActionButton;
