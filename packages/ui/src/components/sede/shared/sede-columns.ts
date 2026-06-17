export interface SedeColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export const defaultSedeColumns: SedeColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, width: 'minmax(200px, 1.4fr)' },
  { key: 'address', label: 'Dirección', width: 'minmax(160px, 1.1fr)' },
  { key: 'city', label: 'Ciudad', sortable: true, width: 'minmax(100px, 0.7fr)' },
  { key: 'phone', label: 'Teléfono', width: 'minmax(120px, 0.9fr)' },
  { key: 'users', label: 'Usuarios', width: 'minmax(90px, 0.6fr)' },
  { key: 'status', label: 'Estado', width: '100px' },
  { key: 'actions', label: 'Acciones', width: '88px' },
];

export const sedeGridTemplate = defaultSedeColumns.map((column) => column.width ?? '1fr').join(' ');
