import { Loader2 } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaActionButton.module.scss';

export type RecetaActionAccent = 'purple' | 'teal' | 'gold';
export type RecetaActionVariant = 'soft' | 'solid';

export interface RecetaActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  loading?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
  accent?: RecetaActionAccent;
  variant?: RecetaActionVariant;
}

export function RecetaActionButton({
  label = 'Nueva receta',
  icon,
  loading = false,
  disabled,
  theme = 'light',
  size = 'md',
  accent = 'purple',
  variant = 'soft',
  className,
  ...props
}: RecetaActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`accent--${accent}`],
        styles[`variant--${variant}`],
        loading && styles.loading,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {(loading || icon) && (
        <span className={styles.icon}>{loading ? <Loader2 aria-hidden /> : icon}</span>
      )}
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default RecetaActionButton;
