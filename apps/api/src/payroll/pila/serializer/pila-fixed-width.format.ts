/**
 * Helpers de formato fixed-width PILA (Anexo Técnico 2).
 * Errores técnicos (overflow / caracteres inválidos) — no validación de negocio.
 *
 * Encoding: ASCII tras sanitización documentada en `pila-fixed-width.constants.ts`.
 */

export class PilaSerializationError extends Error {
  constructor(
    readonly field: string,
    readonly value: string,
    message: string,
  ) {
    super(`${message} [field=${field}, value=${JSON.stringify(value)}]`);
    this.name = 'PilaSerializationError';
  }
}

export type SanitizeAlphaOptions = {
  /** Permite guion (códigos UGPP: 14-11, 25-14). No usar en nombres. */
  allowHyphen?: boolean;
};

/**
 * Normaliza texto **solo para el archivo plano exportado**.
 * No muta el draft/snapshot: nombres y razón social originales se conservan en JSON.
 * Ver tabla de caracteres en `pila-fixed-width.constants.ts`.
 */
export function sanitizePilaAlpha(raw: string, options?: SanitizeAlphaOptions): string {
  const allowHyphen = options?.allowHyphen === true;
  const base = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const stripped = allowHyphen ? base.replace(/[^A-Z0-9 -]/g, '') : base.replace(/[^A-Z0-9 ]/g, '');
  // Tras eliminar caracteres no admitidos, colapsar espacios y trim.
  return stripped.replace(/ +/g, ' ').trim();
}

export function padAlphaRight(
  value: string,
  length: number,
  field: string,
  options?: SanitizeAlphaOptions,
): string {
  const cleaned = sanitizePilaAlpha(value, options);
  if (cleaned.length > length) {
    throw new PilaSerializationError(field, value, `Valor alfanumérico excede longitud ${length}`);
  }
  return cleaned.padEnd(length, ' ');
}

/** Códigos administradoras / ARL: permiten guion. */
export function padPilaCodeRight(value: string, length: number, field: string): string {
  return padAlphaRight(value, length, field, { allowHyphen: true });
}

export function padNumericLeft(value: number | string, length: number, field: string): string {
  const raw = typeof value === 'number' ? String(Math.round(value)) : value.trim();
  if (!/^\d*$/.test(raw)) {
    throw new PilaSerializationError(field, raw, 'Campo numérico contiene caracteres no numéricos');
  }
  if (raw.length > length) {
    throw new PilaSerializationError(field, raw, `Valor numérico excede longitud ${length}`);
  }
  return raw.padStart(length, '0');
}

export function formatPilaMoney(amount: number, length: number, field: string): string {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new PilaSerializationError(field, String(amount), 'Monto inválido o negativo');
  }
  return padNumericLeft(Math.round(amount), length, field);
}

export function formatPilaTariff(rate: number, length: number, field: string): string {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new PilaSerializationError(field, String(rate), 'Tarifa inválida');
  }
  const decimals = Math.max(0, length - 2);
  const formatted = rate.toFixed(decimals);
  if (formatted.length > length) {
    throw new PilaSerializationError(field, formatted, `Tarifa excede longitud ${length}`);
  }
  if (formatted.length < length) {
    return formatted.padStart(length, '0');
  }
  return formatted;
}

export function formatPilaPeriod(period: string, field: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new PilaSerializationError(field, period, 'Período debe ser YYYY-MM');
  }
  return period.padEnd(7, ' ');
}

export function emptyAlpha(length: number): string {
  return ' '.repeat(length);
}

export function emptyNumeric(length: number): string {
  return '0'.repeat(length);
}

export function formatSequence(index1Based: number, length: number, field: string): string {
  if (!Number.isInteger(index1Based) || index1Based < 1) {
    throw new PilaSerializationError(field, String(index1Based), 'Secuencia inválida');
  }
  return padNumericLeft(index1Based, length, field);
}

export function formatWorkCenter(code: string, length: number, field: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length > length) {
    throw new PilaSerializationError(field, code, `Centro de trabajo excede ${length} dígitos`);
  }
  return padNumericLeft(digits || '0', length, field);
}

export function assertRecordLength(record: string, expected: number, label: string): void {
  if (record.length !== expected) {
    throw new PilaSerializationError(
      label,
      `len=${record.length}`,
      `Longitud de registro esperada ${expected}, obtenida ${record.length}`,
    );
  }
}

/** Con encoding ASCII, caracteres === bytes; falla si aparece byte > 127. */
export function assertAsciiByteLength(content: string, expectedChars: number, label: string): void {
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) > 127) {
      throw new PilaSerializationError(
        label,
        content.slice(Math.max(0, i - 2), i + 3),
        `Carácter no ASCII en posición ${i}`,
      );
    }
  }
  const bytes = Buffer.byteLength(content, 'ascii');
  if (bytes !== expectedChars || content.length !== expectedChars) {
    throw new PilaSerializationError(
      label,
      `chars=${content.length},bytes=${bytes}`,
      `Longitud en bytes ASCII esperada ${expectedChars}`,
    );
  }
}
