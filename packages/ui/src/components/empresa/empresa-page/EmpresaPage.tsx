import React, { type JSX, type ReactNode } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaPage.module.scss';

export interface EmpresaPageProps {
  children?: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaPage({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaPageProps): JSX.Element {
  return (
    <div
      className={[styles.page, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default EmpresaPage;
