import { EmpleadoRowActionButton, ActiveInactiveStatusBadge } from '@restopsiq/ui';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { RecipeListItem } from '@/features/recetas/types';

import styles from './RecipeListCard.module.scss';

export interface RecipeListCardProps {
  recipe: RecipeListItem;
  theme: UiTheme;
  onEdit: () => void;
  onOpen: () => void;
  onToggleStatus?: () => void;
  toggleLoading?: boolean;
}

export function RecipeListCard({
  recipe,
  theme,
  onEdit,
  onOpen,
  onToggleStatus,
  toggleLoading = false,
}: RecipeListCardProps): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.code}>{recipe.code}</span>
          <span className={styles.name}>{recipe.name}</span>
        </span>
      }
      badge={<ActiveInactiveStatusBadge status={recipe.status} theme={theme} size="sm" />}
      fields={[
        { label: 'Categoría', value: recipe.category },
        { label: 'Tiempo est.', value: `${recipe.durationMin} min` },
        { label: 'Fases', value: String(recipe.phases) },
      ]}
      footer={
        <>
          <EmpleadoRowActionButton
            variant="edit"
            theme={theme}
            size="sm"
            aria-label="Editar receta"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          />
          {onToggleStatus ? (
            <EmpleadoRowActionButton
              variant="toggle"
              active={recipe.status === 'active'}
              theme={theme}
              size="sm"
              disabled={toggleLoading}
              aria-label={recipe.status === 'active' ? 'Desactivar receta' : 'Activar receta'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus();
              }}
            />
          ) : null}
        </>
      }
      onClick={onOpen}
    />
  );
}
