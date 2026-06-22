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
  { key: 'users', label: 'Usuarios', width: 'minmax(72px, 0.45fr)' },
  { key: 'status', label: 'Estado', width: '100px' },
  { key: 'actions', label: 'Acciones', width: '120px' },
];

function parseColumnMinWidthPx(width: string): number {
  const minmaxMatch = width.match(/minmax\((\d+)px/i);
  if (minmaxMatch) {
    return Number(minmaxMatch[1]);
  }

  const fixedMatch = width.match(/^(\d+)px$/i);
  if (fixedMatch) {
    return Number(fixedMatch[1]);
  }

  return 100;
}

/** Minimum table width (px) before horizontal scroll — sum of column mins + row padding. */
export function getSedeTableMinWidthPx(): number {
  const columnSum = defaultSedeColumns.reduce(
    (total, column) => total + parseColumnMinWidthPx(column.width ?? '1fr'),
    0,
  );

  return columnSum + 28;
}

export const sedeGridTemplate = defaultSedeColumns.map((column) => column.width ?? '1fr').join(' ');
