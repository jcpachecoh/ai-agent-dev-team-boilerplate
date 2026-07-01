import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoProfileTab.module.scss';

export interface EmpleadoProfileTabProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  active?: boolean;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
}

export function EmpleadoProfileTab({
  label = 'SECCIÓN',
  icon,
  active = false,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: EmpleadoProfileTabProps): JSX.Element {
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
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default EmpleadoProfileTab;
