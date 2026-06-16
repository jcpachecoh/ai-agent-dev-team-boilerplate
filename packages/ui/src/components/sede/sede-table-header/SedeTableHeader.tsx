import { ArrowDownUp } from 'lucide-react';
import React, { type CSSProperties, type JSX } from 'react';

import { defaultSedeColumns, sedeGridTemplate } from '../shared/sede-columns';
import type { SedeColumnDef } from '../shared/sede-columns';
import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeTableHeader.module.scss';

export interface SedeTableHeaderProps {
  columns?: SedeColumnDef[];
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeTableHeader({
  columns = defaultSedeColumns,
  theme = 'dark',
  size = 'md',
  className,
}: SedeTableHeaderProps): JSX.Element {
  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--sede-columns': sedeGridTemplate } as CSSProperties}
    >
      {columns.map((column) => (
        <span
          key={column.key}
          className={[styles.cell, column.sortable && styles.sortable].filter(Boolean).join(' ')}
          role="columnheader"
        >
          {column.label}
          {column.sortable && <ArrowDownUp aria-hidden />}
        </span>
      ))}
    </div>
  );
}

export default SedeTableHeader;
