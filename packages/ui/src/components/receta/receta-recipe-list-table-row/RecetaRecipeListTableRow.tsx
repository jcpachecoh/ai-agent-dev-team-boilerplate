import type { CSSProperties, JSX } from 'react';

import { EmpleadoRowActionButton } from '../../empleado/empleado-row-action-button';
import { RecetaCategoryChip } from '../receta-category-chip';
import { RecetaPhasesCount } from '../receta-phases-count';
import { RecetaStatusButton } from '../receta-status-button';
import { RecetaTimeProgress } from '../receta-time-progress';
import type { RecetaSize, RecetaStatus, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaRecipeListTableRow.module.scss';

export interface RecetaRecipeListTableRowProps {
  code?: string;
  recipeName?: string;
  updatedAt?: string;
  category?: string;
  durationMin?: number;
  maxDurationMin?: number;
  phases?: number | string;
  versionLabel?: string;
  status?: RecetaStatus;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  toggleLoading?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
  columnsTemplate?: string;
  visibleColumnKeys?: string[];
}

const defaultVisibleKeys = [
  'id',
  'nombre',
  'categoria',
  'tiempo',
  'fases',
  'version',
  'estado',
  'acciones',
];

export function RecetaRecipeListTableRow({
  code = 'RC-006',
  recipeName = 'Arepas Rellenas',
  updatedAt = '2026-05-28',
  category = 'Entrada',
  durationMin = 25,
  maxDurationMin = 120,
  phases = 4,
  versionLabel = 'v1.2',
  status = 'active',
  onEdit,
  onToggleStatus,
  toggleLoading = false,
  theme = 'dark',
  size = 'md',
  className,
  columnsTemplate,
  visibleColumnKeys = defaultVisibleKeys,
}: RecetaRecipeListTableRowProps): JSX.Element {
  const visible = new Set(visibleColumnKeys);

  const renderCell = (key: string): JSX.Element | null => {
    switch (key) {
      case 'id':
        return (
          <span className={styles.code} role="cell">
            {code}
          </span>
        );
      case 'nombre':
        return (
          <div className={styles.nameCell} role="cell">
            <span className={styles.name}>{recipeName}</span>
            {updatedAt ? <span className={styles.updatedAt}>{updatedAt}</span> : null}
          </div>
        );
      case 'categoria':
        return (
          <span className={styles.categoryCell} role="cell">
            <RecetaCategoryChip label={category} theme={theme} size={size} />
          </span>
        );
      case 'tiempo':
        return (
          <span className={styles.timeCell} role="cell">
            <RecetaTimeProgress
              durationMin={durationMin}
              maxDurationMin={maxDurationMin}
              theme={theme}
              size={size}
            />
          </span>
        );
      case 'fases':
        return (
          <span className={styles.phasesCell} role="cell">
            <RecetaPhasesCount count={phases} theme={theme} size={size} />
          </span>
        );
      case 'version':
        return (
          <span className={styles.version} role="cell">
            {versionLabel}
          </span>
        );
      case 'estado':
        return (
          <span className={styles.statusCell} role="cell">
            <RecetaStatusButton status={status} theme={theme} size="sm" compact />
          </span>
        );
      case 'acciones':
        return (
          <span className={styles.actionsCell} role="cell">
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
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={
        columnsTemplate ? ({ '--receta-columns': columnsTemplate } as CSSProperties) : undefined
      }
    >
      {defaultVisibleKeys
        .filter((key) => visible.has(key))
        .map((key) => (
          <div key={key} className={styles.cell}>
            {renderCell(key)}
          </div>
        ))}
    </div>
  );
}

export default RecetaRecipeListTableRow;
