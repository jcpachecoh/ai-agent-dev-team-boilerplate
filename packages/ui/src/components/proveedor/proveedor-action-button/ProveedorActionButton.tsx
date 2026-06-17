import { Download, Plus } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorActionButton.module.scss';

export type ProveedorActionButtonVariant = 'primary' | 'secondary' | 'export' | 'new-product';

export interface ProveedorActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: ProveedorActionButtonVariant;
  label?: string;
  icon?: ReactNode;
  loading?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
}

const defaultLabels: Record<ProveedorActionButtonVariant, string> = {
  primary: 'NUEVO PROVEEDOR',
  secondary: 'ACCION',
  export: 'EXPORTAR',
  'new-product': 'NUEVO PRODUCTO',
};

const defaultIcons: Partial<Record<ProveedorActionButtonVariant, ReactNode>> = {
  primary: <Plus aria-hidden />,
  export: <Download aria-hidden />,
  'new-product': <Plus aria-hidden />,
};

export function ProveedorActionButton({
  variant = 'primary',
  label,
  icon,
  loading = false,
  disabled,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: ProveedorActionButtonProps): JSX.Element {
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

export default ProveedorActionButton;
