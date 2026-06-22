import React, { type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorPageHeader.module.scss';

export interface ProveedorPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorPageHeader({
  title = 'Proveedores',
  subtitle = 'Gestión de proveedores',
  icon,
  actions,
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
      <div className={styles.leading}>
        {icon ? (
          <div className={styles.iconWrap} aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default ProveedorPageHeader;
