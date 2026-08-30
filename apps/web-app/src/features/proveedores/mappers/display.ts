import type { ProveedorPriceTrend } from '@restopsiq/ui';

import type { CondicionPago, StockUnit, SupplierViewModel } from '../types';

const CONDICION_PAGO_LABELS: Record<CondicionPago, string> = {
  CONTADO: 'Contado',
  DIAS_15: '15 días',
  DIAS_30: '30 días',
  DIAS_60: '60 días',
};

const STOCK_UNIT_LABELS: Record<StockUnit, string> = {
  UNIT: 'Unidad',
  GRAMS: 'g',
  KILOGRAMS: 'Kg',
  ML: 'ml',
  LITERS: 'L',
  BOX: 'Caja',
};

export function formatCondicionPago(value: CondicionPago): string {
  return CONDICION_PAGO_LABELS[value];
}

const LOGISTICS_HISTORY_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
};

export function formatLogisticsHistoryAction(action: string): string {
  return LOGISTICS_HISTORY_ACTION_LABELS[action] ?? action;
}

export function formatStockUnit(value: StockUnit): string {
  return STOCK_UNIT_LABELS[value];
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCop(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return formatCop(value);
}

export function formatReliability(calificacion: number): string {
  return `${calificacion.toFixed(1)} ★`;
}

export function formatNit(supplier: Pick<SupplierViewModel, 'nit' | 'dv'>): string {
  const digits = supplier.nit.replace(/\D/g, '');
  let formatted = supplier.nit;
  if (digits.length === 9) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}`;
  }
  if (supplier.dv) {
    return `${formatted}-${supplier.dv}`;
  }
  return formatted;
}

export function getPriceTrend(current: number, previous?: number): ProveedorPriceTrend {
  if (previous === undefined || previous === current) return 'neutral';
  return current > previous ? 'up' : 'down';
}

export function formatMoq(quantity: number, unit: StockUnit): string {
  const unitLabel = STOCK_UNIT_LABELS[unit].toLowerCase();
  return `${quantity} ${unitLabel}`;
}
