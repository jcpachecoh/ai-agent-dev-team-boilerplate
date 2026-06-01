import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorDetailTab.module.scss';

export interface ProveedorDetailTabProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  active?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
}

export function ProveedorDetailTab({
  label = 'INFORMACIÓN',
  icon,
  active = false,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: ProveedorDetailTabProps): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.tab,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        active && styles.active,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default ProveedorDetailTab;
