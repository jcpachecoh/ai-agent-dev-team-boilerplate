import { BadRequestException } from '@nestjs/common';

import type { ResolvedTaxWithholdingBracket } from '../interfaces/tax-withholding-brackets.interfaces';
import { TAX_WITHHOLDING_BRACKET_COUNT } from '../tax-withholding-brackets.constants';

/**
 * Valida integridad de una tabla de retención resuelta para una vigencia.
 * Lanza BadRequestException si hay superposición, más de un tramo abierto o tabla incompleta.
 */
export function validateTaxWithholdingBracketSet(
  brackets: readonly ResolvedTaxWithholdingBracket[],
): void {
  if (brackets.length === 0) {
    throw new BadRequestException(
      'Tabla de retención en la fuente inexistente para la vigencia solicitada',
    );
  }

  if (brackets.length !== TAX_WITHHOLDING_BRACKET_COUNT) {
    throw new BadRequestException(
      `Tabla de retención incompleta: se esperaban ${TAX_WITHHOLDING_BRACKET_COUNT} tramos, hay ${brackets.length}`,
    );
  }

  const openEnded = brackets.filter((b): boolean => b.toUvtInclusive === null);
  if (openEnded.length > 1) {
    throw new BadRequestException(
      'Tabla de retención inválida: más de un tramo con límite superior abierto',
    );
  }
  if (openEnded.length === 0) {
    throw new BadRequestException(
      'Tabla de retención incompleta: falta el tramo con límite superior abierto',
    );
  }

  const sorted = [...brackets].sort((a, b): number => a.fromUvtExclusive - b.fromUvtExclusive);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.toUvtInclusive === null) {
      throw new BadRequestException(
        'Tabla de retención inválida: el tramo abierto debe ser el último',
      );
    }

    if (current.toUvtInclusive > next.fromUvtExclusive) {
      throw new BadRequestException('Tabla de retención inválida: rangos UVT superpuestos');
    }

    if (current.toUvtInclusive !== next.fromUvtExclusive) {
      throw new BadRequestException('Tabla de retención incompleta: hay huecos entre tramos UVT');
    }
  }
}

export function mapToResolvedTaxWithholdingBracket(row: {
  lowerUvtBound: { toNumber?: () => number } | number | string;
  upperUvtBound: { toNumber?: () => number } | number | string | null;
  marginalRate: { toNumber?: () => number } | number | string;
  fixedTaxUvt: { toNumber?: () => number } | number | string;
}): ResolvedTaxWithholdingBracket {
  return {
    fromUvtExclusive: toNumber(row.lowerUvtBound),
    toUvtInclusive: row.upperUvtBound === null ? null : toNumber(row.upperUvtBound),
    rate: toNumber(row.marginalRate),
    fixedDeductionUvt: toNumber(row.fixedTaxUvt),
  };
}

function toNumber(value: { toNumber?: () => number } | number | string): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}
