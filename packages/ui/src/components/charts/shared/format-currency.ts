/** Colombian peso format: $1.250.000 */
export function formatCurrencyCOP(value: number, decimals = 0): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = decimals > 0 && decPart ? `${withThousands},${decPart}` : withThousands;
  return `${sign}$${formatted}`;
}
