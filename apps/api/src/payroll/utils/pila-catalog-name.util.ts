import { EmployeeCatalogType } from '@prisma/client';

/**
 * Normaliza nombres de catálogo para lookup (EPS/ARL/AFP/CCF → pilaCode).
 * Los seeds históricos usaban nombres cortos ("Sura", "Sanitas") mientras el
 * catálogo UGPP usa el nombre oficial ("EPS Sura", "EPS Sanitas", "ARL Sura").
 */
export function catalogNameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Alias demo/seed → clave del nombre oficial en `employee_catalog_options`.
 * Solo se usan cuando el exact match falla; no inventan códigos.
 */
const CATALOG_NAME_ALIASES: Partial<Record<EmployeeCatalogType, Record<string, string>>> = {
  [EmployeeCatalogType.EPS]: {
    sura: 'eps sura',
    sanitas: 'eps sanitas',
    compensar: 'compensar eps',
  },
  [EmployeeCatalogType.ARL]: {
    sura: 'arl sura',
  },
};

/**
 * Resuelve `pilaCode` desde un mapa name→code (claves ya normalizadas con
 * `catalogNameKey`). Prueba exact match y luego alias de seed.
 */
export function resolveCatalogPilaCode(
  codesByNormalizedName: Map<string, string | null>,
  type: EmployeeCatalogType,
  rawName: string | null | undefined,
): string | null {
  if (!rawName?.trim()) return null;

  const key = catalogNameKey(rawName);
  if (codesByNormalizedName.has(key)) {
    return codesByNormalizedName.get(key) ?? null;
  }

  const alias = CATALOG_NAME_ALIASES[type]?.[key];
  if (alias && codesByNormalizedName.has(alias)) {
    return codesByNormalizedName.get(alias) ?? null;
  }

  return null;
}
