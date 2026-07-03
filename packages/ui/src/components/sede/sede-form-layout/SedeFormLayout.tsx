import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeFormLayout.module.scss';

export interface SedeFormLayoutProps {
  children?: ReactNode;
  sideColumn?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeFormLayout({
  children,
  sideColumn,
  theme = 'light',
  size = 'md',
  className,
}: SedeFormLayoutProps): JSX.Element {
  return (
    <div
      className={[
        styles.layout,
        sideColumn && styles.withSide,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.main}>{children}</div>
      {sideColumn && <div className={styles.side}>{sideColumn}</div>}
    </div>
  );
}

export default SedeFormLayout;
