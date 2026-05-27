import { Plus } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import Spinner from '../../Spinner';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaActionButton.module.scss';

export interface RecetaActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  loading?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

export function RecetaActionButton({
  label = 'Nueva receta',
  icon,
  loading = false,
  disabled,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaActionButtonProps): JSX.Element {
  const displayIcon = icon ?? <Plus aria-hidden />;

  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 'sm' : 'md'} />
      ) : (
        <span className={styles.icon}>{displayIcon}</span>
      )}
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default RecetaActionButton;
