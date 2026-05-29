import React, { type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorPageHeader.module.scss';

export interface ProveedorPageHeaderProps {
  title?: string;
  subtitle?: string;
  brandInitial?: string;
  icon?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorPageHeader({
  title = 'SUPPLIER MANAGEMENT',
  subtitle = 'PROCUREMENT · RESTOPSIQ ENTERPRISE',
  brandInitial = 'S',
  icon,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.brand} aria-hidden={icon ? undefined : true}>
        {icon ?? <span className={styles.initial}>{brandInitial}</span>}
      </div>
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </header>
  );
}

export default ProveedorPageHeader;
