import { Plus, Save } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeActionButton.module.scss';

export type SedeActionButtonVariant = 'primary' | 'secondary' | 'save' | 'create';

export interface SedeActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: SedeActionButtonVariant;
  label?: string;
  icon?: ReactNode;
  loading?: boolean;
  theme?: SedeTheme;
  size?: SedeSize;
}

const defaultLabels: Record<SedeActionButtonVariant, string> = {
  primary: 'Nueva sede',
  secondary: 'Cancelar',
  save: 'Guardar cambios',
  create: 'Crear sede',
};

const defaultIcons: Partial<Record<SedeActionButtonVariant, ReactNode>> = {
  primary: <Plus aria-hidden />,
  save: <Save aria-hidden />,
  create: <Save aria-hidden />,
};

export function SedeActionButton({
  variant = 'primary',
  label,
  icon,
  loading = false,
  disabled,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: SedeActionButtonProps): JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        loading && styles.loading,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {(icon ?? defaultIcons[variant]) && (
        <span className={styles.icon}>{icon ?? defaultIcons[variant]}</span>
      )}
      <span className={styles.label}>{label ?? defaultLabels[variant]}</span>
    </button>
  );
}

export default SedeActionButton;
