import React, { type JSX, type ReactNode } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaFormLayout.module.scss';

export interface EmpresaFormLayoutProps {
  main: ReactNode;
  side: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaFormLayout({
  main,
  side,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaFormLayoutProps): JSX.Element {
  return (
    <div
      className={[styles.layout, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.main}>{main}</div>
      <div className={styles.side}>{side}</div>
    </div>
  );
}

export default EmpresaFormLayout;
