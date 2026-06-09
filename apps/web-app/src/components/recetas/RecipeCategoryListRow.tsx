import { InventarioIconButton, RecetaEditButton, RecetaStatusButton } from '@restopsiq/ui';
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
  onStatusChange: (status: RecetaStatus) => void;
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
  onStatusChange,
}: RecipeCategoryListRowProps): React.JSX.Element {
  const nextStatus: RecetaStatus = status === 'active' ? 'inactive' : 'active';

  const renderCell = (columnId: string): React.ReactNode => {
    switch (columnId) {
      case 'id':
        return <span className={styles.code}>{code}</span>;
      case 'nombre':
        return <span className={styles.name}>{nombre}</span>;
      case 'descripcion':
        return <span className={styles.description}>{descripcion || '—'}</span>;
      case 'estado':
        return (
          <RecetaStatusButton
            status={status}
            theme={theme}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onStatusChange(nextStatus);
            }}
          />
        );
      case 'acciones':
        return (
          <span className={styles.actions}>
            <RecetaEditButton
              theme={theme}
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            />
            <span role="presentation" onClick={(event) => event.stopPropagation()}>
              <InventarioIconButton
                variant="delete"
                theme={theme}
                ariaLabel="Eliminar categoría"
                onClick={onDelete}
              />
            </span>
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
        <span key={column.id} className={styles.cell} role="cell">
          {renderCell(column.id)}
        </span>
      ))}
    </div>
  );
}
