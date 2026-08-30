export interface RolColumnDef {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export const defaultRolColumns: RolColumnDef[] = [
  { key: 'code', label: 'Código', width: '160px' },
  { key: 'name', label: 'Nombre', width: '1fr' },
  { key: 'users', label: 'Usuarios', width: '80px', align: 'center' },
  { key: 'permissions', label: 'Permisos', width: '90px', align: 'center' },
  { key: 'status', label: 'Estado', width: '100px', align: 'center' },
  { key: 'actions', label: 'Acciones', width: '148px', align: 'right' },
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
