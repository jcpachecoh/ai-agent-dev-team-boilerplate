import { RecetaEditButton, RecetaStatusButton } from '@restopsiq/ui';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { RecipeListItem } from '@/features/recetas/types';

import styles from './RecipeListCard.module.scss';

export interface RecipeListCardProps {
  recipe: RecipeListItem;
  theme: UiTheme;
  onEdit: () => void;
  onOpen: () => void;
}

export function RecipeListCard({
  recipe,
  theme,
  onEdit,
  onOpen,
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
      badge={<RecetaStatusButton status={recipe.status} theme={theme} size="sm" />}
      fields={[
        { label: 'Categoría', value: recipe.category },
        { label: 'Tiempo est.', value: `${recipe.durationMin} min` },
        { label: 'Fases', value: String(recipe.phases) },
      ]}
      footer={
        <RecetaEditButton
          theme={theme}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        />
      }
      onClick={onOpen}
    />
  );
}
