import type { CargoSortColumnKey, CargoSortDirection } from './cargo-columns';

export function toggleCargoSort(
  currentColumn: CargoSortColumnKey | null,
  currentDirection: CargoSortDirection,
  nextColumn: CargoSortColumnKey,
): { column: CargoSortColumnKey; direction: CargoSortDirection } {
  if (currentColumn === nextColumn) {
    return {
      column: nextColumn,
      direction: currentDirection === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    column: nextColumn,
    direction: 'asc',
  };
}

export function formatCargoSalary(value?: number | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numeric);
}
