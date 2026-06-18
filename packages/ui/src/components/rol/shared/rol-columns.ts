export interface RolColumnDef {
  key: string;
  label: string;
  width?: string;
}

export const defaultRolColumns: RolColumnDef[] = [
  { key: 'code', label: 'Código', width: '160px' },
  { key: 'name', label: 'Nombre', width: '1fr' },
  { key: 'users', label: 'Usuarios', width: '80px' },
  { key: 'permissions', label: 'Permisos', width: '90px' },
  { key: 'status', label: 'Estado', width: '100px' },
  { key: 'actions', label: 'Acciones', width: '90px' },
];

export function getRolColumns(showActions = true): RolColumnDef[] {
  return showActions
    ? defaultRolColumns
    : defaultRolColumns.filter((column) => column.key !== 'actions');
}

export function getRolGridTemplate(showActions = true): string {
  return getRolColumns(showActions)
    .map((column) => column.width ?? '1fr')
    .join(' ');
}
