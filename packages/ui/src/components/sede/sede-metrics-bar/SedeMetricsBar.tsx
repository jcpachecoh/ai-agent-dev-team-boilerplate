import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeMetricsBar.module.scss';

export interface SedeMetricsBarProps {
  children?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeMetricsBar({
  children,
  theme = 'light',
  size = 'md',
  className,
}: SedeMetricsBarProps): JSX.Element {
  return (
    <div
      className={[styles.bar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default SedeMetricsBar;
