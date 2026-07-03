import {
  EmpleadoRowActionButton,
  InventarioIconButton,
  ActiveInactiveStatusBadge,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { UiTheme } from '@/constants/theme';
import type { RecetaStatus } from '@/features/recetas/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './RecipeCategoryListRow.module.scss';

export interface RecipeCategoryListRowProps {
  code: string;
  nombre: string;
  descripcion: string;
  status: RecetaStatus;
  theme: UiTheme;
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  toggleLoading?: boolean;
}

export function RecipeCategoryListRow({
  code,
  nombre,
  descripcion,
  status,
  theme,
  visibleColumns,
  columnsTemplate,
  onEdit,
  onDelete,
  onToggleStatus,
  toggleLoading = false,
}: RecipeCategoryListRowProps): React.JSX.Element {
  const cellClassName = (columnId: string): string =>
    [
      styles.cell,
      columnId === 'estado' ? styles.cellCenter : null,
      columnId === 'acciones' ? styles.cellRight : null,
    ]
      .filter(Boolean)
      .join(' ');

  const renderCell = (columnId: string): React.ReactNode => {
    switch (columnId) {
      case 'id':
        return <span className={styles.code}>{code}</span>;
      case 'nombre':
        return <span className={styles.name}>{nombre}</span>;
      case 'descripcion':
        return <span className={styles.description}>{descripcion || '—'}</span>;
      case 'estado':
        return <ActiveInactiveStatusBadge status={status} theme={theme} size="sm" />;
      case 'acciones':
        return (
          <span className={styles.actions} onClick={(event) => event.stopPropagation()}>
            <EmpleadoRowActionButton
              variant="edit"
              theme={theme}
              size="sm"
              aria-label="Editar categoría"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
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
                onToggleStatus();
              }}
            />
            <InventarioIconButton
              variant="delete"
              theme={theme}
              onClick={onDelete}
              disabled={toggleLoading}
              ariaLabel="Eliminar categoría"
            />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--receta-columns': columnsTemplate } as CSSProperties}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={cellClassName(column.id)} role="cell">
          {renderCell(column.id)}
        </span>
      ))}
    </div>
  );
}
