import React, { type JSX, type ReactNode } from 'react';

import type { EmpresaBadgeVariant, EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaBadge.module.scss';

export interface EmpresaBadgeProps {
  children: ReactNode;
  variant?: EmpresaBadgeVariant;
  showDot?: boolean;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaBadge({
  children,
  variant = 'primary',
  showDot = false,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`badge--${variant}`],
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showDot ? <span className={styles.dot} aria-hidden /> : null}
      {children}
    </span>
  );
}

export interface EmpresaBadgeRowProps {
  children: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaBadgeRow({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaBadgeRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default EmpresaBadge;
