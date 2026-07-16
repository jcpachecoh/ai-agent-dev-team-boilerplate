/**
 * OS-595 — archivo plano Anexo Técnico 2 v29.
 *
 * ## Encoding (decisión cerrada Fase 4)
 *
 * El Anexo Técnico 2 no fija explícitamente ASCII vs Windows-1252 vs ISO-8859-1
 * en el extracto revisado. Los operadores colombianos aceptan de facto archivos
 * de ancho fijo en juego de caracteres compatible con posiciones 1:1.
 *
 * Decisión RestOpsIQ v1: **ASCII (bytes 0–127)** con normalización documentada
 * de campos alfanuméricos **antes** de emitir. Así:
 * - longitud en caracteres === longitud en bytes;
 * - sin bytes multibyte ambiguos;
 * - determinismo en checksums / golden files.
 *
 * No se usa Windows-1252/ISO-8859-1 en v1 (evitar Ñ/á como byte extendido sin
 * contrato de operador). Si un operador exige ANSI con Ñ literal, abrir ticket.
 *
 * ## Tratamiento de caracteres (regla legal documentada, no silenciosa)
 *
 * | Entrada | Tratamiento |
 * |---------|-------------|
 * | Mayúsculas A–Z, dígitos, espacio | Se conservan |
 * | minúsculas | → MAYÚSCULAS |
 * | Tildes / diéresis (á, ü, …) | NFD + quitar marca → letra base (Á→A) |
 * | Ñ / ñ | → N (vía NFD: Ñ = N + tilde) |
 * | Guion `-` | Permitido **solo** en códigos (AFP/EPS/ARL/CCF) y períodos `YYYY-MM` |
 * | Ampersand `&`, apóstrofe `'`, comillas, `@`, etc. | **Eliminados** (no admitidos en A) |
 * | Otros no ASCII | Eliminados tras normalizar |
 *
 * Si tras sanitizar el valor supera la longitud del campo → `PilaSerializationError`
 * (no truncar).
 *
 * Espacios: tras eliminar caracteres no admitidos se colapsan espacios múltiples y se
 * hace trim (p.ej. `PÉREZ & ASOCIADOS` → `PEREZ ASOCIADOS`).
 *
 * **Importante:** la aceptación final del encoding ante el operador requiere prueba
 * real de carga en Aportes en Línea (pendiente de validación operativa; no cerrada
 * solo con golden files internos).
 *
 * El snapshot JSON conserva nombres/razón social **originales** (sin esta normalización).
 *
 * Terminador: `\r\n`. Sin newline final extra.
 * Nombre: `pila-E-{nit}-{periodHealth}-v{version}.txt`
 */

export const PILA_RECORD_TYPE1_LENGTH = 359;
export const PILA_RECORD_TYPE2_LENGTH = 693;

/** Encoding del archivo plano — ver docstring del módulo. */
export const PILA_FILE_ENCODING = 'ascii' as const;
export const PILA_LINE_TERMINATOR = '\r\n';
export const PILA_TRAILING_NEWLINE = false;

export const PILA_RECORD_TYPE1_ID = '01';
export const PILA_RECORD_TYPE2_ID = '02';
export const PILA_MODALIDAD_ELECTRONICA = '1';

/** Versión técnica del mapper (metadato de exportación). */
export const PILA_TECHNICAL_VERSION = 'anexo2-v29';

export function suggestedPilaFileName(input: {
  nit: string;
  periodHealth: string;
  version?: number;
}): string {
  const version = input.version ?? 1;
  return `pila-E-${input.nit}-${input.periodHealth}-v${version}.txt`;
}
