export type RecetaCategoryTone = 'entrada' | 'plato-fuerte' | 'postre' | 'bebida' | 'default';

export function resolveRecetaCategoryTone(category: string): RecetaCategoryTone {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('entrada')) return 'entrada';
  if (
    normalized.includes('plato') ||
    normalized.includes('fuerte') ||
    normalized.includes('parrilla')
  ) {
    return 'plato-fuerte';
  }
  if (normalized.includes('postre') || normalized.includes('dulce')) return 'postre';
  if (normalized.includes('bebida') || normalized.includes('bar')) return 'bebida';
  return 'default';
}

export function formatRecetaVersionLabel(version: number): string {
  return `v1.${version}`;
}

export function formatRecetaListDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toISOString().slice(0, 10);
}

export function resolveDurationProgressPercent(durationMin: number, maxMin = 120): number {
  if (maxMin <= 0) return 0;
  return Math.min(100, Math.round((durationMin / maxMin) * 100));
}
