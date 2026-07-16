/**
 * Validaciones de campos maestros PILA (OS-595 Fase 1).
 * Longitudes alineadas al Anexo Técnico 2 / DIVIPOLA / UGPP.
 * Incluye dígito de verificación DIAN (NIT) — algoritmo módulo 11.
 */

/** Pesos DIAN de derecha a izquierda sobre los dígitos del NIT (sin DV). */
const DIAN_NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

export function isValidVerificationDigit(value: string): boolean {
  return /^[0-9]$/.test(value);
}

/** Normaliza NIT a solo dígitos (sin guiones, espacios ni DV embebido). */
export function normalizeNitDigits(nit: string): string {
  return nit.replace(/\D/g, '');
}

export function isValidNitBase(nit: string): boolean {
  const digits = normalizeNitDigits(nit);
  return /^\d{3,15}$/.test(digits);
}

/**
 * Calcula el dígito de verificación DIAN de un NIT (solo dígitos base, sin DV).
 * Algoritmo oficial módulo 11 usado por la DIAN para NIT.
 */
export function computeDianVerificationDigit(nitBase: string): string {
  const digits = normalizeNitDigits(nitBase);
  if (!/^\d{3,15}$/.test(digits)) {
    throw new Error(`NIT base inválido para calcular DV: "${nitBase}"`);
  }

  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(digits.charAt(len - 1 - i));
    const weight = DIAN_NIT_WEIGHTS[i];
    if (weight === undefined) {
      throw new Error(`NIT demasiado largo para pesos DIAN: "${digits}"`);
    }
    sum += digit * weight;
  }

  const remainder = sum % 11;
  return String(remainder < 2 ? remainder : 11 - remainder);
}

/** True si el DV almacenado coincide con el algoritmo DIAN del NIT base. */
export function isNitVerificationDigitCoherent(
  nitBase: string,
  verificationDigit: string,
): boolean {
  if (!isValidNitBase(nitBase) || !isValidVerificationDigit(verificationDigit)) {
    return false;
  }
  return computeDianVerificationDigit(nitBase) === verificationDigit;
}

export function isValidDepartmentCode(value: string): boolean {
  return /^\d{2}$/.test(value);
}

export function isValidMunicipalityCode(value: string): boolean {
  return /^\d{3}$/.test(value);
}

/** Códigos UGPP suelen ser ≤ 10 chars (EPS037, 230301, 14-11, CCF22). */
export function isValidPilaCode(value: string): boolean {
  return /^[A-Za-z0-9-]{1,10}$/.test(value);
}

export function isValidArlCode(value: string): boolean {
  return isValidPilaCode(value);
}

export function isValidActividadEconomicaArl(value: string): boolean {
  return /^\d{7}$/.test(value);
}

export function isValidClaseAportante(value: string): boolean {
  return /^[ABCDI]$/.test(value);
}

export function isValidNaturalezaJuridica(value: string): boolean {
  return /^[1-5]$/.test(value);
}

export function isValidFormaPresentacion(value: string): boolean {
  return value === 'U' || value === 'S';
}

export function isValidTipoAportante(value: string): boolean {
  return /^\d{2}$/.test(value);
}

export function isValidPilaDocumentType(value: string): boolean {
  return value === 'NI' || value === 'CC' || value === 'CE' || value === 'TI' || value === 'PA';
}

/**
 * En update de seed: si el row no trae pilaCode oficial, no tocar el valor existente
 * (evita borrar códigos cargados manualmente).
 */
export function catalogSeedPilaCodeUpdate(
  seedPilaCode: string | null,
): { pilaCode: string } | Record<string, never> {
  return seedPilaCode !== null ? { pilaCode: seedPilaCode } : {};
}
