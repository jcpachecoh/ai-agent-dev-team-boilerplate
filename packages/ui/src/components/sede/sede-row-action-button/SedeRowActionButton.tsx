import { Pencil, Power } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeRowActionButton.module.scss';

export type SedeRowActionVariant = 'edit' | 'toggle';

export interface SedeRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: SedeRowActionVariant;
  active?: boolean;
  icon?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
}

const defaultIcons: Record<SedeRowActionVariant, ReactNode> = {
  edit: <Pencil aria-hidden />,
  toggle: <Power aria-hidden />,
};

export function SedeRowActionButton({
  variant = 'edit',
  active = false,
  icon,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: SedeRowActionButtonProps): JSX.Element {
  const resolvedAriaLabel =
    ariaLabel ?? (variant === 'edit' ? 'Editar sede' : active ? 'Desactivar sede' : 'Activar sede');

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        variant === 'toggle' && active && styles.toggleActive,
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

export default SedeRowActionButton;
