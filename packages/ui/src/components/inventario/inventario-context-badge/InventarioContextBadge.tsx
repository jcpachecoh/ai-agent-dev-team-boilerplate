import { Clock3 } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioContextBadge.module.scss';

export type InventarioContextBadgeVariant = 'status' | 'shift';

export interface InventarioContextBadgeProps {
  label?: string;
  variant?: InventarioContextBadgeVariant;
  icon?: ReactNode;
  active?: boolean;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioContextBadge({
  label = 'PLANTA CENTRAL',
  variant = 'status',
  icon,
  active = true,
  theme = 'light',
  size = 'md',
  className,
}: InventarioContextBadgeProps): JSX.Element {
  const resolvedIcon = icon ?? (variant === 'shift' ? <Clock3 aria-hidden /> : null);

  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        active && styles.active,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {variant === 'status' && active ? <span className={styles.statusDot} aria-hidden /> : null}
      {resolvedIcon ? <span className={styles.icon}>{resolvedIcon}</span> : null}
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default InventarioContextBadge;
