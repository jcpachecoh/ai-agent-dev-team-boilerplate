import React, { type CSSProperties, type JSX } from 'react';

import {
  defaultAlertColumns,
  defaultCategoryColumns,
  defaultMovementColumns,
  defaultProductColumns,
  inventarioAlertGridTemplate,
  inventarioCategoryGridTemplate,
  inventarioMovementGridTemplate,
  inventarioProductGridTemplate,
} from '../shared/inventario-columns';
import type {
  InventarioSize,
  InventarioTableColumn,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioTableHeader.module.scss';

export type InventarioTableVariant = 'product' | 'movement' | 'alert' | 'category';

export interface InventarioTableHeaderProps {
  variant?: InventarioTableVariant;
  columns?: InventarioTableColumn[];
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

const defaultColumnsByVariant: Record<InventarioTableVariant, InventarioTableColumn[]> = {
  product: defaultProductColumns,
  movement: defaultMovementColumns,
  alert: defaultAlertColumns,
  category: defaultCategoryColumns,
};

const gridByVariant: Record<InventarioTableVariant, string> = {
  product: inventarioProductGridTemplate,
  movement: inventarioMovementGridTemplate,
  alert: inventarioAlertGridTemplate,
  category: inventarioCategoryGridTemplate,
};

export function InventarioTableHeader({
  variant = 'product',
  columns,
  theme = 'light',
  size = 'xl',
  className,
}: InventarioTableHeaderProps): JSX.Element {
  const resolvedColumns = columns ?? defaultColumnsByVariant[variant];
  const template = resolvedColumns.map((column) => column.width ?? '1fr').join(' ');

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--inventario-columns': template || gridByVariant[variant] } as CSSProperties}
    >
      {resolvedColumns.map((column) => (
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

export default InventarioTableHeader;
