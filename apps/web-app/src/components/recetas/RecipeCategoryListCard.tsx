import { EmpleadoRowActionButton, InventarioIconButton, RecetaStatusButton } from '@restopsiq/ui';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { RecetaStatus } from '@/features/recetas/types';

import styles from './RecipeCategoryListCard.module.scss';

export interface RecipeCategoryListCardProps {
  code: string;
  nombre: string;
  descripcion: string;
  status: RecetaStatus;
  theme: UiTheme;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onOpen: () => void;
  toggleLoading?: boolean;
}

export function RecipeCategoryListCard({
  code,
  nombre,
  descripcion,
  status,
  theme,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpen,
  toggleLoading = false,
}: RecipeCategoryListCardProps): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.code}>{code}</span>
          <span className={styles.name}>{nombre}</span>
        </span>
      }
      badge={
        <RecetaStatusButton
          status={status}
          theme={theme}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus();
          }}
        />
      }
      fields={[{ label: 'Descripción', value: descripcion || '—' }]}
      footer={
        <>
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
            onClick={() => onDelete()}
            disabled={toggleLoading}
            ariaLabel="Eliminar categoría"
          />
        </>
      }
      onClick={onOpen}
    />
  );
}
