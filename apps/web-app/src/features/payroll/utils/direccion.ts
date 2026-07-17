/**
 * Dirección estructurada colombiana: tipo de vía + número de vía + placa (dos
 * partes) + complemento. Se persiste como un único string en
 * `EmployeePersonalData.direccion` con los símbolos `#` y `-` insertados
 * automáticamente, p. ej. "CALLE 45A # 12 - 34, APTO 101".
 */

export const TIPO_VIA_VALUES = [
  'CALLE',
  'CARRERA',
  'DIAGONAL',
  'TRANSVERSAL',
  'AVENIDA',
  'AVENIDA CALLE',
  'AVENIDA CARRERA',
  'CIRCULAR',
  'CIRCUNVALAR',
  'AUTOPISTA',
  'TRONCAL',
  'VARIANTE',
  'BULEVAR',
  'VÍA',
  'PASEO',
  'PASAJE',
] as const;

export const TIPO_VIA_OPTIONS = TIPO_VIA_VALUES.map((value) => ({ value, label: value }));

export interface DireccionParts {
  direccionTipoVia: string;
  direccionNumeroVia: string;
  direccionPlaca1: string;
  direccionPlaca2: string;
  direccionComplemento: string;
}

export const DIRECCION_EMPTY_PARTS: DireccionParts = {
  direccionTipoVia: '',
  direccionNumeroVia: '',
  direccionPlaca1: '',
  direccionPlaca2: '',
  direccionComplemento: '',
};

/** Normaliza texto libre de dirección: mayúsculas y espacios colapsados. */
export function normalizeDireccionText(value: string): string {
  return value.toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Compone la vista previa/valor persistido de la dirección insertando `#` y
 * `-` automáticamente entre los segmentos diligenciados.
 */
export function composeDireccion(parts: DireccionParts): string {
  const tipoVia = parts.direccionTipoVia.trim();
  const numeroVia = parts.direccionNumeroVia.trim();
  const placa1 = parts.direccionPlaca1.trim();
  const placa2 = parts.direccionPlaca2.trim();
  const complemento = parts.direccionComplemento.trim();

  const via = [tipoVia, numeroVia].filter(Boolean).join(' ');

  let placa = '';
  if (placa1 && placa2) {
    placa = `# ${placa1} - ${placa2}`;
  } else if (placa1 || placa2) {
    placa = `# ${placa1 || placa2}`;
  }

  const main = [via, placa].filter(Boolean).join(' ');
  return [main, complemento].filter(Boolean).join(', ');
}

// Tipos de vía más largos primero para que "AVENIDA CALLE" gane sobre "AVENIDA".
const TIPO_VIA_PATTERN = [...TIPO_VIA_VALUES]
  .sort((left, right) => right.length - left.length)
  .map((value) => value.replace(/\s+/g, '\\s+'))
  .join('|');

const DIRECCION_REGEX = new RegExp(
  `^(${TIPO_VIA_PATTERN})\\s+([^#,]+?)(?:\\s*#\\s*([^\\-,]+?)(?:\\s*-\\s*([^,]+?))?)?(?:,\\s*(.+))?$`,
  'iu',
);

/**
 * Intenta descomponer un string de dirección en sus partes estructuradas.
 * Si el formato no coincide (direcciones legadas escritas a mano), todo el
 * texto se conserva en el complemento para no perder información.
 */
export function parseDireccion(direccion: string | null | undefined): DireccionParts {
  const raw = direccion?.trim() ?? '';
  if (!raw) {
    return { ...DIRECCION_EMPTY_PARTS };
  }

  const match = DIRECCION_REGEX.exec(raw);
  if (!match) {
    return { ...DIRECCION_EMPTY_PARTS, direccionComplemento: normalizeDireccionText(raw) };
  }

  const [, tipoVia, numeroVia, placa1, placa2, complemento] = match;
  return {
    direccionTipoVia: normalizeDireccionText(tipoVia ?? ''),
    direccionNumeroVia: normalizeDireccionText(numeroVia?.trim() ?? ''),
    direccionPlaca1: normalizeDireccionText(placa1?.trim() ?? ''),
    direccionPlaca2: normalizeDireccionText(placa2?.trim() ?? ''),
    direccionComplemento: normalizeDireccionText(complemento?.trim() ?? ''),
  };
}
