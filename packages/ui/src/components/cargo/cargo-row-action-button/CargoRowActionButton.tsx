import { Pencil, ToggleRight } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import styles from './CargoRowActionButton.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export type CargoRowActionVariant = 'edit' | 'toggle';

export interface CargoRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: CargoRowActionVariant;
  active?: boolean;
  icon?: ReactNode;
  theme?: CargoTheme;
  size?: CargoSize;
}

const defaultIcons: Record<CargoRowActionVariant, ReactNode> = {
  edit: <Pencil aria-hidden />,
  toggle: <ToggleRight aria-hidden />,
};

export function CargoRowActionButton({
  variant = 'edit',
  active = false,
  icon,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: CargoRowActionButtonProps): JSX.Element {
  const resolvedAriaLabel =
    ariaLabel ??
    (variant === 'edit' ? 'Editar cargo' : active ? 'Desactivar cargo' : 'Activar cargo');

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

export default CargoRowActionButton;
