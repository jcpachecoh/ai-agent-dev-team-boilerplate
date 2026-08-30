import React, { type JSX } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioPageHeader.module.scss';

export interface InventarioPageHeaderProps {
  title?: string;
  subtitle?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioPageHeader({
  title = 'Dashboard de inventario',
  subtitle = 'Resumen operacional en tiempo real · Actualización automática cada 30 s',
  theme = 'light',
  size = 'md',
  className,
}: InventarioPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  );
}

export default InventarioPageHeader;
