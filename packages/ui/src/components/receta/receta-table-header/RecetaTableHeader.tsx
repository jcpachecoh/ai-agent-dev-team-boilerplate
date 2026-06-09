import React, { type CSSProperties, type JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaTableHeader.module.scss';

export interface RecetaTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface RecetaTableHeaderProps {
  columns?: RecetaTableColumn[];
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

const defaultColumns: RecetaTableColumn[] = [
  { key: 'id', label: 'Código', width: '120px' },
  { key: 'name', label: 'Receta', width: '1.6fr' },
  { key: 'category', label: 'Categoría', width: '160px' },
  { key: 'time', label: 'Tiempo', width: '130px' },
  { key: 'portions', label: 'Porciones', width: '120px', align: 'center' },
  { key: 'status', label: 'Estado', width: '140px', align: 'center' },
  { key: 'actions', label: 'Acciones', width: '120px', align: 'right' },
];

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
  theme = 'light',
  size = 'xl',
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
      {columns.map((column) => (
        <span
          key={column.key}
          className={[styles.cell, alignClasses[column.align ?? 'left']].join(' ')}
          role="columnheader"
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

export default RecetaTableHeader;
