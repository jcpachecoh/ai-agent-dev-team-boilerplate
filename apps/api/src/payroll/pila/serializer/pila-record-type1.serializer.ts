import type { PilaAportanteDraft, PilaCotizanteDraft } from '../pila-preparation.interfaces';
import {
  PILA_MODALIDAD_ELECTRONICA,
  PILA_RECORD_TYPE1_ID,
  PILA_RECORD_TYPE1_LENGTH,
} from './pila-fixed-width.constants';
import {
  assertAsciiByteLength,
  assertRecordLength,
  emptyAlpha,
  emptyNumeric,
  formatPilaMoney,
  formatPilaPeriod,
  formatSequence,
  padAlphaRight,
  padNumericLeft,
  padPilaCodeRight,
  PilaSerializationError,
} from './pila-fixed-width.format';

/**
 * Registro tipo 1 (encabezado) — exactamente 359 caracteres.
 * Planilla E, forma U, empleador privado, modalidad electrónica.
 */
export class PilaRecordType1Serializer {
  serialize(
    aportante: PilaAportanteDraft,
    employeeCount: number,
    totalIbcParafiscales: number,
  ): string {
    if (aportante.tipoPlanilla !== 'E') {
      throw new PilaSerializationError(
        'aportante.tipoPlanilla',
        aportante.tipoPlanilla,
        'Serializador v1 solo admite planilla E',
      );
    }
    if (aportante.formaPresentacion !== 'U') {
      throw new PilaSerializationError(
        'aportante.formaPresentacion',
        aportante.formaPresentacion,
        'Serializador v1 solo admite forma U',
      );
    }

    const parts: string[] = [
      padNumericLeft(PILA_RECORD_TYPE1_ID, 2, 't1.campo1'), // 1–2
      PILA_MODALIDAD_ELECTRONICA, // 3 — electrónica
      formatSequence(1, 4, 't1.campo3'), // 4–7 secuencia encabezado
      padAlphaRight(aportante.legalName, 200, 't1.campo4'), // 8–207
      padAlphaRight(aportante.documentType, 2, 't1.campo5'), // 208–209
      padAlphaRight(aportante.nit, 16, 't1.campo6'), // 210–225
      padNumericLeft(aportante.verificationDigit, 1, 't1.campo7'), // 226
      padAlphaRight(aportante.tipoPlanilla, 1, 't1.campo8'), // 227
      emptyAlpha(10), // 228–237 planilla asociada (blanco E)
      emptyAlpha(10), // 238–247 fecha planilla asociada
      padAlphaRight(aportante.formaPresentacion, 1, 't1.campo11'), // 248
      emptyAlpha(10), // 249–258 sucursal
      emptyAlpha(40), // 259–298 nombre sucursal
      padPilaCodeRight(aportante.arlCode, 6, 't1.campo14'), // 299–304
      formatPilaPeriod(aportante.periodOther, 't1.campo15'), // 305–311
      formatPilaPeriod(aportante.periodHealth, 't1.campo16'), // 312–318
      emptyNumeric(10), // 319–328 radicado (operador)
      emptyAlpha(10), // 329–338 fecha pago (operador)
      padNumericLeft(employeeCount, 5, 't1.campo19'), // 339–343
      formatPilaMoney(totalIbcParafiscales, 12, 't1.campo20'), // 344–355
      padNumericLeft(aportante.tipoAportante, 2, 't1.campo21'), // 356–357
      emptyNumeric(2), // 358–359 operador (sistema)
    ];

    const record = parts.join('');
    assertRecordLength(record, PILA_RECORD_TYPE1_LENGTH, 'registroTipo1');
    assertAsciiByteLength(record, PILA_RECORD_TYPE1_LENGTH, 'registroTipo1.bytes');
    return record;
  }
}

/** Helper tipado para tests de cotizante aislados. */
export type { PilaCotizanteDraft };
