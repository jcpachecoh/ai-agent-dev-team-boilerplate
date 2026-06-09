import React, { type JSX, type ReactNode } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioPanel.module.scss';

export interface InventarioPanelProps {
  title?: string;
  children?: ReactNode;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioPanel({
  title,
  children,
  theme = 'light',
  size = 'md',
  className,
}: InventarioPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      <div className={styles.content}>{children}</div>
    </section>
  );
}

export default InventarioPanel;
