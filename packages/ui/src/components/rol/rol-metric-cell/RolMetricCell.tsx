import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolMetricCell.module.scss';

export interface RolMetricCellProps {
  value: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolMetricCell({
  value,
  theme = 'dark',
  size = 'sm',
  className,
}: RolMetricCellProps): JSX.Element {
  return (
    <span
      className={[styles.cell, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {value}
    </span>
  );
}

export default RolMetricCell;
