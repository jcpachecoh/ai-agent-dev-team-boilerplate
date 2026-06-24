export interface UsuarioColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortDirection?: UsuarioSortDirection | null;
  active?: boolean;
  onSort?: () => void;
}

export type UsuarioSortColumnKey = 'name' | 'email';
export type UsuarioSortDirection = 'asc' | 'desc';

export const USUARIO_SORTABLE_COLUMN_KEYS: UsuarioSortColumnKey[] = ['name', 'email'];

export function isUsuarioSortColumnKey(key: string): key is UsuarioSortColumnKey {
  return USUARIO_SORTABLE_COLUMN_KEYS.includes(key as UsuarioSortColumnKey);
}

export const defaultUsuarioColumns: UsuarioColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, width: 'minmax(160px, 1.2fr)' },
  { key: 'email', label: 'Email', sortable: true, width: 'minmax(180px, 1.4fr)' },
  { key: 'cedula', label: 'Cédula', width: 'minmax(120px, 0.85fr)', align: 'center' },
  { key: 'documentType', label: 'Tipo', width: '100px' },
  { key: 'role', label: 'Rol', width: 'minmax(120px, 1fr)' },
  { key: 'status', label: 'Estado', width: '130px', align: 'center' },
  { key: 'lastLoginAt', label: 'Último acceso', width: '110px' },
  { key: 'actions', label: 'Acciones', width: '80px', align: 'right' },
];

export function getUsuarioColumns(showActions = true): UsuarioColumnDef[] {
  if (showActions) {
    return defaultUsuarioColumns;
  }

  return defaultUsuarioColumns.filter((column) => column.key !== 'actions');
}

export function getUsuarioGridTemplate(showActions = true): string {
  return getUsuarioColumns(showActions)
    .map((column) => column.width ?? '1fr')
    .join(' ');
}

export function buildUsuarioHeaderColumns(
  showActions: boolean,
  sortColumn: UsuarioSortColumnKey | null,
  sortDirection: UsuarioSortDirection,
  onSortColumn?: (column: UsuarioSortColumnKey) => void,
): UsuarioColumnDef[] {
  return getUsuarioColumns(showActions).map((column) => {
    const sortKey = column.key;

    if (!column.sortable || !onSortColumn || !isUsuarioSortColumnKey(sortKey)) {
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
