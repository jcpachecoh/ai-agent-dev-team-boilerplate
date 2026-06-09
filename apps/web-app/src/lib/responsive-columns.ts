import type { TableBreakpoint } from '@/hooks/useTableBreakpoint';

export type ColumnPriority = 1 | 2 | 3 | 4 | 5;

export interface ResponsiveColumnDef {
  id: string;
  label: string;
  priority: ColumnPriority;
  gridTrack: string;
  cardLabel?: string;
}

const MAX_VISIBLE_PRIORITY: Record<Exclude<TableBreakpoint, 'mobile'>, ColumnPriority> = {
  desktop: 5,
  laptop: 4,
  tablet: 3,
};

export function isCardMode(bp: TableBreakpoint): boolean {
  return bp === 'mobile';
}

export function columnsForBreakpoint(
  columns: ResponsiveColumnDef[],
  bp: TableBreakpoint,
): ResponsiveColumnDef[] {
  if (bp === 'mobile') return [];

  const maxPriority = MAX_VISIBLE_PRIORITY[bp];
  return columns.filter((column) => column.priority <= maxPriority);
}

export function gridTemplateFromColumns(columns: ResponsiveColumnDef[]): string {
  return columns.map((column) => column.gridTrack).join(' ');
}

export interface ResponsiveHeaderColumn {
  key: string;
  label: string;
  width: string;
  align?: 'left' | 'center' | 'right';
}

export function tableColumnsForVisible<T extends { key: string; width?: string }>(
  allColumns: T[],
  visibleColumns: ResponsiveColumnDef[],
): T[] {
  const visibleById = new Map(visibleColumns.map((column) => [column.id, column]));
  return allColumns
    .filter((column) => visibleById.has(column.key))
    .map((column) => ({
      ...column,
      width: visibleById.get(column.key)?.gridTrack ?? column.width,
    }));
}

export function headerColumnsFromResponsive(
  visibleColumns: ResponsiveColumnDef[],
  alignById?: Partial<Record<string, ResponsiveHeaderColumn['align']>>,
): ResponsiveHeaderColumn[] {
  return visibleColumns.map((column) => ({
    key: column.id,
    label: column.label,
    width: column.gridTrack,
    align: alignById?.[column.id],
  }));
}
