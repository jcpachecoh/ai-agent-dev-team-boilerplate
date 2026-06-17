import React, { type JSX } from 'react';

import styles from './ProduccionRecipeTableHeader.module.scss';
import { produccionRecipeColumns } from '../shared/produccion-columns';
import type { ProduccionSize, ProduccionTheme } from '../shared/produccion-types';
export interface ProduccionRecipeTableHeaderProps {
  columns?: string[];
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionRecipeTableHeader({
  columns = produccionRecipeColumns,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionRecipeTableHeaderProps): JSX.Element {
  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="rowgroup"
    >
      <div className={styles.row} role="row">
        {columns.map((column) => (
          <span key={column} className={styles.cell} role="columnheader">
            {column}
          </span>
        ))}
      </div>
    </div>
  );
}
export default ProduccionRecipeTableHeader;
