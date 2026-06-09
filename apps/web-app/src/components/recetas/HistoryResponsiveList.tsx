import { RecetaHistoryAccordion } from '@restopsiq/ui';

import { ResponsiveTable } from '@/components/responsive-table';
import {
  HistoryExecutionCard,
  type HistoryExecutionItem,
} from '@/components/recetas/HistoryExecutionCard';
import type { UiTheme } from '@/constants/theme';
import { HISTORY_RESPONSIVE_COLUMNS } from '@/features/recetas/history-columns';
import { useTableBreakpoint } from '@/hooks/useTableBreakpoint';
import { isCardMode } from '@/lib/responsive-columns';

export interface HistoryResponsiveListProps {
  items: HistoryExecutionItem[];
  theme: UiTheme;
  className?: string;
}

export function HistoryResponsiveList({
  items,
  theme,
  className,
}: HistoryResponsiveListProps): React.JSX.Element {
  const breakpoint = useTableBreakpoint();

  if (isCardMode(breakpoint)) {
    return (
      <ResponsiveTable<HistoryExecutionItem>
        columns={HISTORY_RESPONSIVE_COLUMNS}
        rows={items}
        keyExtractor={(item) => item.value}
        className={className}
        renderTableHeader={() => null}
        renderTableRow={() => null}
        renderCard={(item) => <HistoryExecutionCard item={item} theme={theme} />}
      />
    );
  }

  return <RecetaHistoryAccordion theme={theme} size="xl" items={items} className={className} />;
}
