/** Max digits for COP integer entry (~999 mil millones). */
export const DEFAULT_MAX_CURRENCY_DIGITS = 12;

export function countDecimalPlaces(step: number): number {
  const normalized = String(step);
  const dot = normalized.indexOf('.');
  if (dot === -1) return 0;
  return normalized.length - dot - 1;
}

/** Snaps a value to the nearest step from min (fixes float drift). */
export function snapToStep(value: number, step: number, min = 0, max?: number): number {
  if (!Number.isFinite(value)) return min;

  const decimals = countDecimalPlaces(step);
  const factor = 10 ** decimals;
  const stepIndex = Math.round((value - min) / step);
  let snapped = min + stepIndex * step;
  snapped = Math.round(snapped * factor) / factor;

  if (max !== undefined) snapped = Math.min(max, snapped);
  snapped = Math.max(min, snapped);

  return snapped;
}

export function formatStepValue(value: number, decimalPlaces: number): string {
  if (decimalPlaces <= 0) return String(value);

  const fixed = value.toFixed(decimalPlaces);
  if (fixed.endsWith('.0')) {
    return fixed.slice(0, -2);
  }
  return fixed;
}

/**
 * Keeps only digits, caps length, strips leading zeros (except lone "0").
 */
export function sanitizeCurrencyDigits(
  raw: string,
  maxDigits = DEFAULT_MAX_CURRENCY_DIGITS,
): string {
  const only = raw.replace(/\D/g, '').slice(0, maxDigits);
  if (!only) return '';
  return only.replace(/^0+/, '') || '0';
}

/** Parses integer COP amounts from digits-only or formatted strings. */
export function parseCurrencyDigits(val: string, maxDigits = DEFAULT_MAX_CURRENCY_DIGITS): number {
  const sanitized = sanitizeCurrencyDigits(val, maxDigits);
  if (!sanitized) return 0;
  return Number.parseInt(sanitized, 10);
}

export function formatCurrencyCop(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
