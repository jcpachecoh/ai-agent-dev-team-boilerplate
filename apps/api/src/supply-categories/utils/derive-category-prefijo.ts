/** Derives a 2–3 char uppercase prefix from a category name (seed/migration fallback). */
export function derivePrefijoFromNombre(nombre: string): string {
  const base = nombre
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3);
  if (base.length >= 2) return base;
  return 'CAT';
}

export function resolveCategoryPrefijo(nombre: string, prefijo: string | null | undefined): string {
  const trimmed = prefijo?.trim();
  if (trimmed) return trimmed.toUpperCase();
  return derivePrefijoFromNombre(nombre);
}
