import { fetchSupplyItems } from '../api/inventario.api';
import type { SupplyCategoryApi } from '../types';

const CODIGO_PATTERN = /^([A-Z0-9]{2,6})-(\d{6})$/i;

export function derivePrefijoFromNombre(nombre: string): string {
  const cleaned = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 3) || 'CAT';
}

export function resolveCategoryPrefijo(category: SupplyCategoryApi): string {
  if (category.prefijo?.trim()) {
    return category.prefijo.trim().toUpperCase();
  }
  return derivePrefijoFromNombre(category.nombre);
}

export function computeNextCodigoInterno(prefijo: string, existingCodigos: string[]): string {
  const normalizedPrefijo = prefijo.toUpperCase();
  const pattern = new RegExp(
    `^${normalizedPrefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{6})$`,
    'i',
  );
  let max = 0;
  for (const codigo of existingCodigos) {
    const match = codigo.match(pattern);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return `${normalizedPrefijo}-${String(max + 1).padStart(6, '0')}`;
}

export function isValidGeneratedSku(sku: string): boolean {
  return CODIGO_PATTERN.test(sku.trim());
}

export async function resolveNextSupplyItemSku(
  category: SupplyCategoryApi | undefined,
): Promise<string> {
  if (!category) return '';

  const prefijo = resolveCategoryPrefijo(category);
  const items = await fetchSupplyItems({ categoriaId: category.id, isActive: undefined });
  return computeNextCodigoInterno(
    prefijo,
    items.map((item) => item.codigoInterno),
  );
}
