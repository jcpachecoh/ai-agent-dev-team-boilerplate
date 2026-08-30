import type { ReactNode } from 'react';

import { ResponsiveTableCard } from '@/components/responsive-table/ResponsiveTableCard';
import { useTableBreakpoint } from '@/hooks/useTableBreakpoint';
import {
  columnsForBreakpoint,
  gridTemplateFromColumns,
  isCardMode,
  type CardModeBelow,
  type ResponsiveColumnDef,
} from '@/lib/responsive-columns';

import styles from './ResponsiveTable.module.scss';

export interface ResponsiveTableRenderContext {
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
  breakpoint: ReturnType<typeof useTableBreakpoint>;
}

export interface ResponsiveTableProps<TRow> {
  columns: ResponsiveColumnDef[];
  rows: TRow[];
  keyExtractor: (row: TRow) => string;
  renderTableHeader: (ctx: ResponsiveTableRenderContext) => ReactNode;
  renderTableRow: (row: TRow, ctx: ResponsiveTableRenderContext) => ReactNode;
  renderCard?: (row: TRow, ctx: ResponsiveTableRenderContext) => ReactNode;
  getCardTitle?: (row: TRow) => ReactNode;
  getCardBadge?: (row: TRow) => ReactNode;
  getCardFieldValue?: (row: TRow, column: ResponsiveColumnDef) => ReactNode;
  getCardFooter?: (row: TRow) => ReactNode;
  onCardClick?: (row: TRow) => void;
  emptyState?: ReactNode;
  className?: string;
  /** Show card layout below this breakpoint (default: mobile only). */
  cardBelow?: CardModeBelow;
}

export function ResponsiveTable<TRow>({
  columns,
  rows,
  keyExtractor,
  renderTableHeader,
  renderTableRow,
  renderCard,
  getCardTitle,
  getCardBadge,
  getCardFieldValue,
  getCardFooter,
  onCardClick,
  emptyState,
  className,
  cardBelow = 'mobile',
}: ResponsiveTableProps<TRow>): React.JSX.Element {
  const breakpoint = useTableBreakpoint();
  const cardMode = isCardMode(breakpoint, cardBelow);
  const visibleColumns = columnsForBreakpoint(columns, breakpoint);
  const columnsTemplate = gridTemplateFromColumns(visibleColumns);

  const ctx: ResponsiveTableRenderContext = {
    visibleColumns,
    columnsTemplate,
    breakpoint,
  };

  if (rows.length === 0) {
    return <div className={[styles.wrap, className].filter(Boolean).join(' ')}>{emptyState}</div>;
  }

  if (cardMode) {
    return (
      <div
        className={[styles.wrap, styles.cardList, className].filter(Boolean).join(' ')}
        role="list"
      >
        {rows.map((row) => {
          const key = keyExtractor(row);

          if (renderCard) {
            return (
              <div key={key} role="listitem">
                {renderCard(row, ctx)}
              </div>
            );
          }

          const title = getCardTitle?.(row) ?? '—';
          const fields = columns
            .filter((column) => column.id !== 'actions')
            .map((column) => ({
              label: column.cardLabel ?? column.label,
              value: getCardFieldValue?.(row, column) ?? '—',
            }));

          return (
            <div key={key} role="listitem">
              <ResponsiveTableCard
                title={title}
                badge={getCardBadge?.(row)}
                fields={fields}
                footer={getCardFooter?.(row)}
                onClick={onCardClick ? () => onCardClick(row) : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={[styles.wrap, styles.tableMode, className].filter(Boolean).join(' ')}>
      {renderTableHeader(ctx)}
      <div className={styles.tableBody} role="rowgroup">
        {rows.map((row) => (
          <div key={keyExtractor(row)} role="row">
            {renderTableRow(row, ctx)}
          </div>
        ))}
      </div>
    </div>
  );
}
