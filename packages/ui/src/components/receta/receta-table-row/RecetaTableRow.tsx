import React, { type CSSProperties, type JSX } from 'react';

import { EmpleadoRowActionButton } from '../../empleado/empleado-row-action-button';
import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
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
  onToggleStatus?: () => void;
  toggleLoading?: boolean;
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
  onToggleStatus,
  toggleLoading = false,
  onStatusChange,
  theme = 'light',
  size = 'md',
  className,
  columnsTemplate,
  density = 'default',
}: RecetaTableRowProps): JSX.Element {
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
        <ActiveInactiveStatusBadge status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.actions} role="cell">
        <EmpleadoRowActionButton
          variant="edit"
          theme={theme}
          size="sm"
          aria-label="Editar receta"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.();
          }}
        />
        {onToggleStatus ? (
          <EmpleadoRowActionButton
            variant="toggle"
            active={status === 'active'}
            theme={theme}
            size="sm"
            disabled={toggleLoading}
            aria-label={status === 'active' ? 'Desactivar receta' : 'Activar receta'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStatus();
            }}
          />
        ) : null}
      </span>
    </div>
  );
}

export default RecetaTableRow;
