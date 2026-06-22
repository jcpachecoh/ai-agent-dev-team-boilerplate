import { EmpleadoRowActionButton, RecetaStatusButton } from '@restopsiq/ui';

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
  onStatusChange: (status: RecetaStatus) => void;
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
  onStatusChange,
  onOpen,
  toggleLoading = false,
}: RecipeCategoryListCardProps): React.JSX.Element {
  const nextStatus: RecetaStatus = status === 'active' ? 'inactive' : 'active';

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
            onStatusChange(nextStatus);
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
              onStatusChange(nextStatus);
            }}
          />
        </>
      }
      onClick={onOpen}
    />
  );
}
