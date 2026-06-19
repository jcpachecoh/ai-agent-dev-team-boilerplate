import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CSSProperties, JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaTableHeader.module.scss';

export type RecetaTableSortDirection = 'asc' | 'desc';

export interface RecetaTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  sortDirection?: RecetaTableSortDirection | null;
  active?: boolean;
  onSort?: () => void;
}

export interface RecetaTableHeaderProps {
  columns?: RecetaTableColumn[];
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export const RECETA_RECIPE_LIST_COLUMNS: RecetaTableColumn[] = [
  { key: 'id', label: 'ID', width: '88px' },
  {
    key: 'nombre',
    label: 'Nombre',
    width: 'minmax(180px, 1.35fr)',
    sortable: true,
    active: true,
    sortDirection: 'asc',
  },
  { key: 'categoria', label: 'Categoría', width: 'minmax(120px, 0.9fr)' },
  { key: 'tiempo', label: 'Tiempo Est.', width: '112px', sortable: true },
  { key: 'fases', label: 'Fases', width: '72px', align: 'center', sortable: true },
  { key: 'version', label: 'Versión', width: '72px' },
  { key: 'estado', label: 'Estado', width: '108px', align: 'center' },
  { key: 'acciones', label: 'Acciones', width: '88px', align: 'right' },
];

const defaultColumns: RecetaTableColumn[] = RECETA_RECIPE_LIST_COLUMNS;

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

const sizeClasses: Record<RecetaSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  xl: styles.sizeXl,
};

const alignClasses: Record<NonNullable<RecetaTableColumn['align']>, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

export function RecetaTableHeader({
  columns = defaultColumns,
  theme = 'dark',
  size = 'md',
  className,
}: RecetaTableHeaderProps): JSX.Element {
  const template = columns.map((column) => column.width ?? '1fr').join(' ');

  return (
    <div
      className={[styles.header, themeClasses[theme], sizeClasses[size], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--receta-columns': template } as CSSProperties}
    >
      {columns.map((column) => {
        const isSortable = Boolean(column.sortable);
        const content = (
          <>
            <span className={styles.label}>{column.label}</span>
            {isSortable ? (
              <span className={styles.sortIcon} aria-hidden>
                {column.sortDirection === 'asc' ? (
                  <ChevronUp size={10} />
                ) : column.sortDirection === 'desc' ? (
                  <ChevronDown size={10} />
                ) : (
                  <ChevronDown size={10} className={styles.sortIconMuted} />
                )}
              </span>
            ) : null}
          </>
        );

        if (isSortable) {
          return (
            <button
              key={column.key}
              type="button"
              className={[
                styles.cell,
                styles.sortable,
                alignClasses[column.align ?? 'left'],
                column.active && styles.cellActive,
              ]
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
              onClick={column.onSort}
            >
              {content}
            </button>
          );
        }

        return (
          <span
            key={column.key}
            className={[styles.cell, alignClasses[column.align ?? 'left']].join(' ')}
            role="columnheader"
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

export default RecetaTableHeader;
