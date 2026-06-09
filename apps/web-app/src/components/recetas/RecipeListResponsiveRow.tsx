import { RecetaEditButton, RecetaStatusButton } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { UiTheme } from '@/constants/theme';
import type { RecipeListItem } from '@/features/recetas/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './RecipeListResponsiveRow.module.scss';

export interface RecipeListResponsiveRowProps {
  recipe: RecipeListItem;
  theme: UiTheme;
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
  onEdit: () => void;
}

export function RecipeListResponsiveRow({
  recipe,
  theme,
  visibleColumns,
  columnsTemplate,
  onEdit,
}: RecipeListResponsiveRowProps): React.JSX.Element {
  const renderCell = (columnId: string): React.ReactNode => {
    switch (columnId) {
      case 'id':
        return <span className={styles.code}>{recipe.code}</span>;
      case 'nombre':
        return <span className={styles.name}>{recipe.name}</span>;
      case 'categoria':
        return <span className={styles.muted}>{recipe.category}</span>;
      case 'tiempo':
        return <span className={styles.muted}>{`${recipe.durationMin} min`}</span>;
      case 'fases':
        return <span className={[styles.muted, styles.center].join(' ')}>{recipe.phases}</span>;
      case 'estado':
        return (
          <span className={styles.center}>
            <RecetaStatusButton status={recipe.status} theme={theme} size="sm" />
          </span>
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
