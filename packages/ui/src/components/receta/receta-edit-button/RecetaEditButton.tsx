import { SquarePen } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaEditButton.module.scss';

export interface RecetaEditButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  ariaLabel?: string;
  iconOnly?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

export function RecetaEditButton({
  label = 'Editar',
  ariaLabel,
  iconOnly = false,
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaEditButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        iconOnly && styles.iconOnly,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-label={iconOnly ? (ariaLabel ?? label) : ariaLabel}
      {...props}
    >
      <SquarePen className={styles.icon} aria-hidden />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

export default RecetaEditButton;
