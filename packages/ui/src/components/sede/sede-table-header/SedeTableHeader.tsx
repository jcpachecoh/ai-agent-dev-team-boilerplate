import { ArrowDownUp, ChevronDown, ChevronUp } from 'lucide-react';
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
      {columns.map((column) => {
        const isSortable = Boolean(column.sortable);
        const sortIcon =
          column.sortDirection === 'asc' ? (
            <ChevronUp aria-hidden />
          ) : column.sortDirection === 'desc' ? (
            <ChevronDown aria-hidden />
          ) : (
            <ArrowDownUp aria-hidden />
          );

        const content = (
          <>
            <span className={styles.label}>{column.label}</span>
            {isSortable ? <span className={styles.sortIcon}>{sortIcon}</span> : null}
          </>
        );

        if (isSortable) {
          return (
            <button
              key={column.key}
              type="button"
              className={[styles.cell, styles.sortable, column.active && styles.cellActive]
                .filter(Boolean)
                .join(' ')}
              role="columnheader"
              aria-sort={
                column.sortDirection === 'asc'
                  ? 'ascending'
                  : column.sortDirection === 'desc'
                    ? 'descending'
                    : 'none'
              }
              onClick={() => column.onSort?.()}
            >
              {content}
            </button>
          );
        }

        return (
          <span key={column.key} className={styles.cell} role="columnheader">
            {content}
          </span>
        );
      })}
    </div>
  );
}

export default SedeTableHeader;
