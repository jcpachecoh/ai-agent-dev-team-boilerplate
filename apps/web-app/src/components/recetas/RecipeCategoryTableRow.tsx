import { EmpleadoRowActionButton, InventarioIconButton, RecetaStatusButton } from '@restopsiq/ui';
import type { CSSProperties, JSX } from 'react';

import type { UiTheme } from '@/constants/theme';
import type { RecetaStatus } from '@/features/recetas/types';

import styles from './RecipeCategoryTableRow.module.scss';

export interface RecipeCategoryTableRowProps {
  theme?: UiTheme;
  code: string;
  nombre: string;
  descripcion: string;
  status: RecetaStatus;
  columnsTemplate: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  toggleLoading?: boolean;
}

export function RecipeCategoryTableRow({
  theme = 'dark',
  code,
  nombre,
  descripcion,
  status,
  columnsTemplate,
  onEdit,
  onDelete,
  onToggleStatus,
  toggleLoading = false,
}: RecipeCategoryTableRowProps): JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--receta-columns': columnsTemplate } as CSSProperties}
    >
      <span className={styles.code} role="cell">
        {code}
      </span>
      <span className={styles.name} role="cell">
        {nombre}
      </span>
      <span className={styles.description} role="cell">
        {descripcion || '—'}
      </span>
      <span className={styles.status} role="cell">
        <RecetaStatusButton
          status={status}
          theme={theme}
          size="sm"
          compact
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus?.();
          }}
        />
      </span>
      <span className={styles.actions} role="cell">
        <EmpleadoRowActionButton
          variant="edit"
          theme={theme}
          size="sm"
          aria-label="Editar categoría"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.();
          }}
        />
        <EmpleadoRowActionButton
          variant="toggle"
          active={status === 'active'}
          theme={theme}
          size="sm"
          disabled={toggleLoading}
          aria-label={status === 'active' ? 'Desactivar categoría' : 'Activar categoría'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus?.();
          }}
        />
        <InventarioIconButton
          variant="delete"
          theme={theme}
          onClick={() => onDelete?.()}
          disabled={toggleLoading}
          ariaLabel="Eliminar categoría"
        />
      </span>
    </div>
  );
}
