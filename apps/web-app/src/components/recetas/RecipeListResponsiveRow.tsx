import { RecetaRecipeListTableRow } from '@restopsiq/ui';

import type { UiTheme } from '@/constants/theme';
import type { RecipeListItem } from '@/features/recetas/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export interface RecipeListResponsiveRowProps {
  recipe: RecipeListItem;
  theme: UiTheme;
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
  maxDurationMin?: number;
  onEdit: () => void;
  onCopy?: () => void;
}

export function RecipeListResponsiveRow({
  recipe,
  theme,
  visibleColumns,
  columnsTemplate,
  maxDurationMin = 120,
  onEdit,
  onCopy,
}: RecipeListResponsiveRowProps): React.JSX.Element {
  return (
    <RecetaRecipeListTableRow
      code={recipe.code}
      recipeName={recipe.name}
      updatedAt={recipe.updatedAt}
      category={recipe.category}
      durationMin={recipe.durationMin}
      maxDurationMin={maxDurationMin}
      phases={recipe.phases}
      versionLabel={recipe.versionLabel}
      status={recipe.status}
      theme={theme}
      size="md"
      columnsTemplate={columnsTemplate}
      visibleColumnKeys={visibleColumns.map((column) => column.id)}
      onEdit={onEdit}
      onCopy={onCopy}
    />
  );
}
