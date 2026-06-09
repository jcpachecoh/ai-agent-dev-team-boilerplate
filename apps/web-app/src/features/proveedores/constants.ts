import type { RecetaFilterOption } from '@restopsiq/ui';

import type {
  CondicionPago,
  CondicionPagoFilter,
  SupplierStatusFilter,
  SupplierViewModel,
} from './types';

export const PROVEEDOR_TABLE_SIZE = 'xl' as const;

export const STATUS_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Estado' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
];

export const PAYMENT_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Condición' },
  { value: 'CONTADO', label: 'Contado' },
  { value: 'DIAS_15', label: '15 días' },
  { value: 'DIAS_30', label: '30 días' },
  { value: 'DIAS_60', label: '60 días' },
];

export const CATEGORY_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Categoría' },
  { value: 'Proteínas', label: 'Proteínas' },
  { value: 'Lácteos', label: 'Lácteos' },
  { value: 'Vegetales', label: 'Vegetales' },
  { value: 'Especias', label: 'Especias' },
  { value: 'Panadería', label: 'Panadería' },
  { value: 'Aceites', label: 'Aceites' },
  { value: 'Varios', label: 'Varios' },
];

export const TIPO_OPTIONS: RecetaFilterOption[] = [
  { value: 'PERSONA_JURIDICA', label: 'Persona jurídica' },
  { value: 'PERSONA_NATURAL', label: 'Persona natural' },
];

export const CONDICION_PAGO_OPTIONS: RecetaFilterOption[] = [
  { value: 'CONTADO', label: 'Contado' },
  { value: 'DIAS_15', label: '15 días' },
  { value: 'DIAS_30', label: '30 días' },
  { value: 'DIAS_60', label: '60 días' },
];

export const STOCK_UNIT_OPTIONS: RecetaFilterOption[] = [
  { value: 'KILOGRAMS', label: 'Kg' },
  { value: 'GRAMS', label: 'Gramos' },
  { value: 'LITERS', label: 'Litros' },
  { value: 'ML', label: 'ml' },
  { value: 'UNIT', label: 'Unidad' },
];

export const CATALOG_STATUS_OPTIONS: RecetaFilterOption[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'limited', label: 'Limitado' },
];

export function matchesStatusFilter(
  status: SupplierStatusFilter,
  supplierStatus: SupplierViewModel['status'],
): boolean {
  if (status === 'all') return true;
  return supplierStatus === status;
}

export function matchesPaymentFilter(
  filter: CondicionPagoFilter,
  condicionPago: CondicionPago,
): boolean {
  if (filter === 'all') return true;
  return condicionPago === filter;
}
