export type DecimalKeypadKey = string;

/**
 * Applies a decimal keypad key to the current quantity string.
 * Supports digits, a single decimal separator, and backspace.
 */
export function applyDecimalKey(current: string, key: DecimalKeypadKey, decimal = '.'): string {
  if (key === 'backspace') {
    return current.slice(0, -1);
  }

  if (key === decimal) {
    if (current.includes(decimal)) return current;
    return current ? `${current}${decimal}` : `0${decimal}`;
  }

  if (!/^\d$/.test(key)) return current;

  if (current === '0') return key;
  return current + key;
}

export function parseQuantityNumeric(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatQuantityWithUnit(value: string, unit: string): string {
  const display = value.trim() || '0';
  return `${display} ${unit}`;
}

export function buildTargetHint(targetAmount: number, actualAmount: number, unit: string): string {
  const delta = actualAmount - targetAmount;
  const sign = delta >= 0 ? '+' : '';
  return `Meta: ${targetAmount.toFixed(1)} ${unit} (${sign}${delta.toFixed(1)} ${unit})`;
}
