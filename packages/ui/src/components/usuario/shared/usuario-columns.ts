export interface UsuarioColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export const defaultUsuarioColumns: UsuarioColumnDef[] = [
  { key: 'email', label: 'Email', sortable: true, width: 'minmax(180px, 1.4fr)' },
  { key: 'cedula', label: 'Cédula', width: 'minmax(120px, 1fr)' },
  { key: 'documentType', label: 'Tipo', width: '100px' },
  { key: 'role', label: 'Rol', width: 'minmax(120px, 1fr)' },
  { key: 'status', label: 'Estado', width: '130px' },
  { key: 'lastLoginAt', label: 'Último acceso', width: '110px' },
  { key: 'actions', label: 'Acciones', width: '80px' },
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
