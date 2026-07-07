export interface CargoColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortDirection?: CargoSortDirection | null;
  active?: boolean;
  onSort?: () => void;
}

export type CargoSortColumnKey = 'title' | 'area';
export type CargoSortDirection = 'asc' | 'desc';

export const CARGO_SORTABLE_COLUMN_KEYS: CargoSortColumnKey[] = ['title', 'area'];

export function isCargoSortColumnKey(key: string): key is CargoSortColumnKey {
  return CARGO_SORTABLE_COLUMN_KEYS.includes(key as CargoSortColumnKey);
}

export const CARGO_TABLE_COLUMN_GAP_PX = 20;

export const defaultCargoColumns: CargoColumnDef[] = [
  { key: 'title', label: 'Nombre del cargo', sortable: true, width: 'minmax(200px, 1.4fr)' },
  { key: 'area', label: 'Área', sortable: true, width: 'minmax(140px, 1fr)' },
  {
    key: 'salary',
    label: 'Rango salarial base',
    width: 'minmax(148px, 0.9fr)',
    align: 'right',
  },
  { key: 'status', label: 'Estado', width: 'minmax(108px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: '72px', align: 'right' },
];

export function getCargoColumns(showActions = true): CargoColumnDef[] {
  if (showActions) {
    return defaultCargoColumns;
  }
  return defaultCargoColumns.filter((column) => column.key !== 'actions');
}

export function getCargoGridTemplate(showActions = true): string {
  return getCargoColumns(showActions)
    .map((column) => column.width ?? '1fr')
    .join(' ');
}

function getColumnMinWidthPx(width?: string): number {
  if (!width) {
    return 80;
  }

  const minmaxMatch = width.match(/minmax\((\d+)px/i);
  if (minmaxMatch) {
    return Number(minmaxMatch[1]);
  }

  const pxMatch = width.match(/^(\d+)px$/i);
  if (pxMatch) {
    return Number(pxMatch[1]);
  }

  if (width === 'max-content') {
    return 96;
  }

  const minmaxMaxContentMatch = width.match(/minmax\((\d+)px,\s*max-content\)/i);
  if (minmaxMaxContentMatch) {
    return Number(minmaxMaxContentMatch[1]);
  }

  return 80;
}

export function getCargoTableMinWidthPx(showActions = true): number {
  const columns = getCargoColumns(showActions);
  const columnsWidth = columns.reduce((sum, column) => sum + getColumnMinWidthPx(column.width), 0);
  const gaps = Math.max(columns.length - 1, 0) * CARGO_TABLE_COLUMN_GAP_PX;

  return columnsWidth + gaps + 24;
}

export function buildCargoHeaderColumns(
  showActions: boolean,
  sortColumn: CargoSortColumnKey | null,
  sortDirection: CargoSortDirection,
  onSortColumn?: (column: CargoSortColumnKey) => void,
): CargoColumnDef[] {
  return getCargoColumns(showActions).map((column) => {
    const sortKey = column.key;

    if (!column.sortable || !onSortColumn || !isCargoSortColumnKey(sortKey)) {
      return column;
    }

    const isActive = sortColumn === sortKey;

    return {
      ...column,
      active: isActive,
      sortDirection: isActive ? sortDirection : null,
      onSort: () => onSortColumn(sortKey),
    };
  });
}

export const cargoGridTemplate = getCargoGridTemplate(true);
