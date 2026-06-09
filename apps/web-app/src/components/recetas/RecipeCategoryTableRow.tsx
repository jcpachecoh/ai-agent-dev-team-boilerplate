import { InventarioIconButton, RecetaEditButton, RecetaStatusButton } from '@restopsiq/ui';
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
  onStatusChange?: (status: RecetaStatus) => void;
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
  onStatusChange,
}: RecipeCategoryTableRowProps): JSX.Element {
  const nextStatus: RecetaStatus = status === 'active' ? 'inactive' : 'active';

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
        <span
          className={styles.deleteAction}
          role="presentation"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <InventarioIconButton
            variant="delete"
            theme={theme}
            ariaLabel="Eliminar categoría"
            onClick={() => onDelete?.()}
          />
        </span>
      </span>
    </div>
  );
}
