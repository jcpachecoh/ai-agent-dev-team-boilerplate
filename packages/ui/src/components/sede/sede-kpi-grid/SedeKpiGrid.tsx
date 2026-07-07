import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeKpiGrid.module.scss';

export interface SedeKpiGridProps {
  children?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeKpiGrid({
  children,
  theme = 'light',
  size = 'md',
  className,
}: SedeKpiGridProps): JSX.Element {
  return (
    <div
      className={[styles.grid, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default SedeKpiGrid;
