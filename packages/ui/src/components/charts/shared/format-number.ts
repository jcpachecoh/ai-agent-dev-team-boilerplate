/** Compact axis labels: 1.2K, 3.4M */
export function formatNumberCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    const formatted = n >= 10 ? n.toFixed(0) : n.toFixed(1).replace('.', ',');
    return `${sign}${formatted}M`;
  }

  if (abs >= 1_000) {
    const n = abs / 1_000;
    const formatted = n >= 10 ? n.toFixed(0) : n.toFixed(1).replace('.', ',');
    return `${sign}${formatted}K`;
  }

  return `${sign}${abs.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}
