/** Format integer as Colombian thousands: 1500000 → "1.500.000" */
export function formatThousands(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const num =
    typeof value === 'string'
      ? parseInt(value.replace(/[^\d]/g, ''), 10)
      : Math.floor(value as number);
  if (isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
}

/** Strip formatting and return raw integer: "1.500.000" → 1500000 */
export function parseThousands(display: string): number {
  const digits = display.replace(/[^\d]/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
}
