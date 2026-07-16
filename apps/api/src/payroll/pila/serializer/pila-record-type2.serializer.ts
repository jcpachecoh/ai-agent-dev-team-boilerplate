import type { PilaCotizanteDraft } from '../pila-preparation.interfaces';
import { PILA_RECORD_TYPE2_ID, PILA_RECORD_TYPE2_LENGTH } from './pila-fixed-width.constants';
import {
  assertAsciiByteLength,
  assertRecordLength,
  emptyAlpha,
  emptyNumeric,
  formatPilaMoney,
  formatPilaTariff,
  formatSequence,
  formatWorkCenter,
  padAlphaRight,
  padNumericLeft,
  padPilaCodeRight,
  PilaSerializationError,
} from './pila-fixed-width.format';

/**
 * Registro tipo 2 (cotizante) — exactamente 693 caracteres.
 * Cotizante 01, línea limpia: sin novedades, sin FSP, no exonerado.
 * No recalcula IBC, tasas ni aportes — solo formatea el draft.
 */
export class PilaRecordType2Serializer {
  serialize(cotizante: PilaCotizanteDraft, sequence1Based: number): string {
    if (cotizante.tipoCotizante !== '01') {
      throw new PilaSerializationError(
        'cotizante.tipoCotizante',
        cotizante.tipoCotizante,
        'Serializador v1 solo admite cotizante 01',
      );
    }

    const c = cotizante.contributions;
    const ibc = cotizante.contributionBase;
    const days = Math.min(30, Math.max(0, Math.round(cotizante.workedDays)));
    const pensionCotizacion = c.employeePension + c.employerPension;
    const healthCotizacion = c.employeeHealth + c.employerHealth;
    const pensionTariff = c.employeePensionPct + c.employerPensionPct;
    const healthTariff = c.employeeHealthPct + c.employerHealthPct;
    const hours = Math.min(999, days * 8);

    const parts: string[] = [
      padNumericLeft(PILA_RECORD_TYPE2_ID, 2, 't2.campo1'), // 1–2
      formatSequence(sequence1Based, 5, 't2.campo2'), // 3–7
      padAlphaRight(cotizante.documentType, 2, 't2.campo3'), // 8–9
      padAlphaRight(cotizante.documentNumber, 16, 't2.campo4'), // 10–25
      padNumericLeft(cotizante.tipoCotizante, 2, 't2.campo5'), // 26–27
      emptyNumeric(2), // 28–29 subtipo
      emptyAlpha(1), // 30 extranjero
      emptyAlpha(1), // 31 colombiano exterior
      padAlphaRight(cotizante.departmentCode, 2, 't2.campo9'), // 32–33
      padAlphaRight(cotizante.municipalityCode, 3, 't2.campo10'), // 34–36
      padAlphaRight(cotizante.firstLastName, 20, 't2.campo11'), // 37–56
      padAlphaRight(cotizante.secondLastName ?? '', 30, 't2.campo12'), // 57–86
      padAlphaRight(cotizante.firstName, 20, 't2.campo13'), // 87–106
      emptyAlpha(30), // 107–136 segundo nombre
      // 15–29 novedades blancas
      emptyAlpha(1), // 137 ING
      emptyAlpha(1), // 138 RET
      emptyAlpha(1), // 139 TDE
      emptyAlpha(1), // 140 TAE
      emptyAlpha(1), // 141 TDP
      emptyAlpha(1), // 142 TAP
      emptyAlpha(1), // 143 VSP
      emptyAlpha(1), // 144 Correcciones
      emptyAlpha(1), // 145 VST
      emptyAlpha(1), // 146 SLN
      emptyAlpha(1), // 147 IGE
      emptyAlpha(1), // 148 LMA
      emptyAlpha(1), // 149 VAC
      emptyAlpha(1), // 150 AVP
      emptyAlpha(1), // 151 VCT
      emptyNumeric(2), // 152–153 IRL días
      padPilaCodeRight(cotizante.afpCode, 6, 't2.campo31'), // 154–159
      emptyAlpha(6), // 160–165 AFP traslado
      padPilaCodeRight(cotizante.epsCode, 6, 't2.campo33'), // 166–171
      emptyAlpha(6), // 172–177 EPS traslado
      padPilaCodeRight(cotizante.ccfCode, 6, 't2.campo35'), // 178–183
      padNumericLeft(days, 2, 't2.campo36'), // 184–185
      padNumericLeft(days, 2, 't2.campo37'), // 186–187
      padNumericLeft(days, 2, 't2.campo38'), // 188–189
      padNumericLeft(days, 2, 't2.campo39'), // 190–191
      formatPilaMoney(cotizante.salaryAmount, 9, 't2.campo40'), // 192–200
      cotizante.isIntegralSalary ? 'X' : ' ', // 201
      formatPilaMoney(ibc, 9, 't2.campo42'), // 202–210 IBC pensión
      formatPilaMoney(ibc, 9, 't2.campo43'), // 211–219 IBC salud
      formatPilaMoney(ibc, 9, 't2.campo44'), // 220–228 IBC ARL
      formatPilaMoney(ibc, 9, 't2.campo45'), // 229–237 IBC CCF
      formatPilaTariff(pensionTariff, 7, 't2.campo46'), // 238–244
      formatPilaMoney(pensionCotizacion, 9, 't2.campo47'), // 245–253
      emptyNumeric(9), // 254–262 AVP afiliado
      emptyNumeric(9), // 263–271 AVP aportante
      formatPilaMoney(pensionCotizacion, 9, 't2.campo50'), // 272–280 total pensión
      emptyNumeric(9), // 281–289 FSP solidaridad
      emptyNumeric(9), // 290–298 FSP subsistencia
      emptyNumeric(9), // 299–307 valor no retenido
      formatPilaTariff(healthTariff, 7, 't2.campo54'), // 308–314
      formatPilaMoney(healthCotizacion, 9, 't2.campo55'), // 315–323
      emptyNumeric(9), // 324–332 UPC
      emptyAlpha(15), // 333–347 auth IGE
      emptyNumeric(9), // 348–356 valor IGE
      emptyAlpha(15), // 357–371 auth LMA
      emptyNumeric(9), // 372–380 valor LMA
      formatPilaTariff(c.employerArlPct, 9, 't2.campo61'), // 381–389
      formatWorkCenter(cotizante.workCenterCode, 9, 't2.campo62'), // 390–398
      formatPilaMoney(c.employerArl, 9, 't2.campo63'), // 399–407
      formatPilaTariff(c.employerCajaPct, 7, 't2.campo64'), // 408–414
      formatPilaMoney(c.employerCaja, 9, 't2.campo65'), // 415–423
      formatPilaTariff(c.employerSenaPct, 7, 't2.campo66'), // 424–430
      formatPilaMoney(c.employerSena, 9, 't2.campo67'), // 431–439
      formatPilaTariff(c.employerIcbfPct, 7, 't2.campo68'), // 440–446
      formatPilaMoney(c.employerIcbf, 9, 't2.campo69'), // 447–455
      emptyNumeric(7), // 456–462 ESAP tarifa
      emptyNumeric(9), // 463–471 ESAP valor
      emptyNumeric(7), // 472–478 MEN tarifa
      emptyNumeric(9), // 479–487 MEN valor
      emptyAlpha(2), // 488–489 doc cotizante principal
      emptyAlpha(16), // 490–505 id cotizante principal
      'N', // 506 exoneración Ley 1607
      padPilaCodeRight(cotizante.arlCode, 6, 't2.campo77'), // 507–512
      padAlphaRight(cotizante.arlRiskClass, 1, 't2.campo78'), // 513
      emptyAlpha(1), // 514 tarifa especial pensiones
      emptyAlpha(10), // 515–524 fecha ING
      emptyAlpha(10), // 525–534 fecha RET
      emptyAlpha(10), // 535–544 VSP
      emptyAlpha(10), // 545–554 SLN ini
      emptyAlpha(10), // 555–564 SLN fin
      emptyAlpha(10), // 565–574 IGE ini
      emptyAlpha(10), // 575–584 IGE fin
      emptyAlpha(10), // 585–594 LMA ini
      emptyAlpha(10), // 595–604 LMA fin
      emptyAlpha(10), // 605–614 VAC ini
      emptyAlpha(10), // 615–624 VAC fin
      emptyAlpha(10), // 625–634 VCT ini
      emptyAlpha(10), // 635–644 VCT fin
      emptyAlpha(10), // 645–654 IRL ini
      emptyAlpha(10), // 655–664 IRL fin
      formatPilaMoney(ibc, 9, 't2.campo95'), // 665–673 IBC otros parafiscales
      padNumericLeft(hours, 3, 't2.campo96'), // 674–676 horas
      emptyAlpha(10), // 677–686 fecha radicación exterior
      padNumericLeft(cotizante.actividadEconomicaArl, 7, 't2.campo98'), // 687–693
    ];

    const record = parts.join('');
    assertRecordLength(record, PILA_RECORD_TYPE2_LENGTH, 'registroTipo2');
    assertAsciiByteLength(record, PILA_RECORD_TYPE2_LENGTH, 'registroTipo2.bytes');
    return record;
  }
}
