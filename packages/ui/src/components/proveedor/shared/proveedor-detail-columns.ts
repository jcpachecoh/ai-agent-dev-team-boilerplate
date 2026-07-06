import type { ProveedorColumnDef } from './proveedor-columns';

export const ocHistoryColumns: ProveedorColumnDef[] = [
  { key: 'order', label: 'ORDEN DE COMPRA', width: 'minmax(140px, 1.2fr)' },
  { key: 'date', label: 'FECHA', width: '110px' },
  { key: 'items', label: 'ITEMS', width: '70px', align: 'center' },
  { key: 'total', label: 'TOTAL', width: 'minmax(110px, 0.9fr)' },
  { key: 'deliveryDate', label: 'FECHA ENTREGA', width: '120px' },
  { key: 'status', label: 'ESTADO', width: '110px', align: 'center' },
  { key: 'actions', label: 'ACCIONES', width: '100px', align: 'right' },
];

export const qualityColumns: ProveedorColumnDef[] = [
  { key: 'date', label: 'FECHA', width: '110px' },
  { key: 'type', label: 'TIPO', width: 'minmax(160px, 1.4fr)' },
  { key: 'score', label: 'CALIFICACIÓN', width: '100px' },
  { key: 'defects', label: 'DEFECTOS', width: '90px', align: 'center' },
  { key: 'inspector', label: 'INSPECTOR', width: 'minmax(100px, 0.8fr)' },
  { key: 'compliance', label: 'CUMPLIMIENTO', width: '130px', align: 'center' },
  { key: 'actions', label: 'ACCIONES', width: '110px', align: 'right' },
];

export const payableColumns: ProveedorColumnDef[] = [
  { key: 'invoice', label: 'FACTURA', width: 'minmax(120px, 1fr)' },
  { key: 'oc', label: 'OC', width: '120px' },
  { key: 'date', label: 'FECHA', width: '110px' },
  { key: 'dueDate', label: 'VENCIMIENTO', width: '120px' },
  { key: 'amount', label: 'MONTO', width: 'minmax(110px, 0.9fr)' },
  { key: 'aging', label: 'AGING', width: '70px', align: 'center' },
  { key: 'status', label: 'ESTADO', width: '110px', align: 'center' },
  { key: 'actions', label: 'ACCIONES', width: '90px', align: 'right' },
];

export const ocHistoryGridTemplate = ocHistoryColumns.map((c) => c.width ?? '1fr').join(' ');
export const qualityGridTemplate = qualityColumns.map((c) => c.width ?? '1fr').join(' ');
export const documentationColumns: ProveedorColumnDef[] = [
  { key: 'document', label: 'DOCUMENTO', width: 'minmax(180px, 1.6fr)' },
  { key: 'required', label: 'OBLIGATORIO', width: '110px', align: 'center' },
  { key: 'validity', label: 'VIGENCIA', width: 'minmax(120px, 1fr)' },
  { key: 'status', label: 'ESTADO', width: '120px', align: 'center' },
  { key: 'uploadedAt', label: 'ÚLTIMA CARGA', width: '120px' },
  { key: 'actions', label: 'ACCIONES', width: '132px', align: 'right' },
];

export const documentationGridTemplate = documentationColumns
  .map((c) => c.width ?? '1fr')
  .join(' ');
export const payableGridTemplate = payableColumns.map((c) => c.width ?? '1fr').join(' ');
