import type { JSX } from 'react';

import styles from './ProduccionStationTableHeader.module.scss';
import {
  produccionStationColumnDefs,
  type ProduccionStationColumnDef,
} from '../shared/produccion-columns';
import type { ProduccionSize, ProduccionTheme } from '../shared/produccion-types';

export interface ProduccionStationTableHeaderProps {
  columns?: ProduccionStationColumnDef[];
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export function ProduccionStationTableHeader({
  columns = produccionStationColumnDefs,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionStationTableHeaderProps): JSX.Element {
  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="rowgroup"
    >
      <div className={styles.row} role="row">
        {columns.map((column) => (
          <span
            key={column.label}
            className={[styles.cell, alignClasses[column.align ?? 'left']].join(' ')}
            role="columnheader"
          >
            {column.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProduccionStationTableHeader;
