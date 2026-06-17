export interface ProveedorColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export const defaultSupplierColumns: ProveedorColumnDef[] = [
  { key: 'id', label: 'ID', width: '100px' },
  { key: 'name', label: 'PROVEEDOR', width: 'minmax(160px, 1.4fr)' },
  { key: 'category', label: 'CATEGORÍA', width: 'minmax(120px, 0.9fr)' },
  { key: 'status', label: 'ESTADO', width: '100px', align: 'center' },
  { key: 'payment', label: 'CONDICIÓN PAGO', width: 'minmax(110px, 0.9fr)' },
  { key: 'leadTime', label: 'LEAD TIME', width: '90px' },
  { key: 'reliability', label: 'CONFIABILIDAD', width: '110px' },
  { key: 'products', label: 'PRODUCTOS', width: '80px', align: 'center' },
  { key: 'balance', label: 'SALDO CXP', width: 'minmax(100px, 0.8fr)' },
  { key: 'lastPo', label: 'ÚLTIMA OC', width: '100px' },
];

export const defaultCatalogColumns: ProveedorColumnDef[] = [
  { key: 'product', label: 'PRODUCTO', width: 'minmax(180px, 1.6fr)' },
  { key: 'sku', label: 'SKU', width: '100px' },
  { key: 'unit', label: 'UNIDAD', width: '70px' },
  { key: 'currentPrice', label: 'PRECIO ACTUAL', width: '120px' },
  { key: 'previousPrice', label: 'PRECIO ANTERIOR', width: '120px' },
  { key: 'moq', label: 'MOQ', width: '70px' },
  { key: 'status', label: 'ESTADO', width: '100px', align: 'center' },
  { key: 'actions', label: 'ACCIONES', width: '110px', align: 'right' },
];

export const supplierGridTemplate = defaultSupplierColumns
  .map((column) => column.width ?? '1fr')
  .join(' ');

export const catalogGridTemplate = defaultCatalogColumns
  .map((column) => column.width ?? '1fr')
  .join(' ');
