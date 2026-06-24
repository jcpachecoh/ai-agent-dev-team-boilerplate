export type ProduccionColumnAlign = 'left' | 'center' | 'right';

export interface ProduccionStationColumnDef {
  label: string;
  align?: ProduccionColumnAlign;
}

export const produccionStationColumnDefs: ProduccionStationColumnDef[] = [
  { label: 'Código' },
  { label: 'Nombre' },
  { label: 'Ubicación' },
  { label: 'Tipo' },
  { label: 'Capac.' },
  { label: 'Estado', align: 'center' },
  { label: 'Recetas' },
  { label: 'Acciones', align: 'right' },
];

export const produccionStationColumns = produccionStationColumnDefs.map((column) => column.label);
export const produccionRecipeColumns = [
  'Nombre',
  'Producto',
  'Lote',
  'Fases',
  'Tiempo total',
  'Versión',
  'Estado',
];
