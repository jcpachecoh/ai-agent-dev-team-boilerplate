/**
 * Builds a Spanish example placeholder from a field label (e.g. "Razón social" → "Ej: Razón social").
 */
export function fieldPlaceholderFromLabel(label: string): string {
  const cleaned = label
    .replace(/\s*\*+\s*$/u, '')
    .replace(/\s*\(opcional\)\s*$/iu, '')
    .trim();

  if (!cleaned) return '';

  return `Ej: ${cleaned}`;
}
