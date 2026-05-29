import React, { type CSSProperties, type JSX } from 'react';

import { RecetaEditButton } from '../receta-edit-button';
import { RecetaStatusButton } from '../receta-status-button';
import type { RecetaSize, RecetaStatus, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaTableRow.module.scss';

export interface RecetaTableRowProps {
  code?: string;
  recipeName?: string;
  category?: string;
  duration?: string;
  portions?: string | number;
  updatedAt?: string;
  status?: RecetaStatus;
  onEdit?: () => void;
  onStatusChange?: (status: RecetaStatus) => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
  /** Grid template columns; should match `RecetaTableHeader` columns. */
  columnsTemplate?: string;
  /** Compact row density for dense data tables. */
  density?: 'default' | 'compact';
}

export function RecetaTableRow({
  code = 'RC-002',
  recipeName = 'Costillas BBQ',
  category = 'Plato Fuerte',
  duration = '60 min',
  portions = 8,
  updatedAt,
  status = 'active',
  onEdit,
  onStatusChange,
  theme = 'light',
  size = 'md',
  className,
  columnsTemplate,
  density = 'default',
}: RecetaTableRowProps): JSX.Element {
  const nextStatus: RecetaStatus = status === 'active' ? 'inactive' : 'active';

  return (
    <div
      className={[
        styles.row,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        density === 'compact' && styles.densityCompact,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={
        columnsTemplate ? ({ '--receta-columns': columnsTemplate } as CSSProperties) : undefined
      }
    >
      <span className={styles.code} role="cell">
        {code}
      </span>
      <span className={styles.name} role="cell">
        {recipeName}
      </span>
      <span className={styles.category} role="cell">
        {category}
      </span>
      <span className={styles.duration} role="cell">
        {duration}
      </span>
      <span className={styles.portions} role="cell">
        {portions}
      </span>
      {updatedAt && (
        <span className={styles.updated} role="cell">
          {updatedAt}
        </span>
      )}
      <span className={styles.status} role="cell">
        <RecetaStatusButton
          status={status}
          theme={theme}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onStatusChange?.(nextStatus);
          }}
        />
      </span>
      <span className={styles.actions} role="cell">
        <RecetaEditButton
          theme={theme}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.();
          }}
        />
      </span>
    </div>
  );
}

export default RecetaTableRow;
