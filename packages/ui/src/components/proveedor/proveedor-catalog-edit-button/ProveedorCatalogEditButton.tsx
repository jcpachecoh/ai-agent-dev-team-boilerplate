import { SquarePen } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorCatalogEditButton.module.scss';

export interface ProveedorCatalogEditButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
}

export function ProveedorCatalogEditButton({
  label = 'EDITAR',
  theme = 'light',
  size = 'md',
  className,
  disabled,
  ...props
}: ProveedorCatalogEditButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <SquarePen className={styles.icon} aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export default ProveedorCatalogEditButton;
