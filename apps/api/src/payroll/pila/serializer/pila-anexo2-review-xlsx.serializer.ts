import ExcelJS from 'exceljs';

import type { PilaPeriodDraft } from '../pila-preparation.interfaces';
import { PilaFixedWidthSerializer } from './pila-fixed-width.serializer';

const PILA_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type PilaAnexo2ReviewXlsxResult = {
  bytes: Buffer;
  mimeType: typeof PILA_MIME_XLSX;
  suggestedFileName: string;
};

/**
 * Excel legible del Anexo Técnico 2 completo (revisión / auditoría).
 * Incluye cotizantes (1 fila = 1 registro tipo 2), encabezado tipo 1,
 * totales y las líneas exactas del archivo plano.
 * No es plantilla Aportes en Línea ni sustituye el TXT oficial para el operador.
 */
export class PilaAnexo2ReviewXlsxSerializer {
  private readonly flatSerializer = new PilaFixedWidthSerializer();

  async serializeAsync(
    draft: PilaPeriodDraft,
    opts: { version: number },
  ): Promise<PilaAnexo2ReviewXlsxResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    // Cotizantes primero: es el contenido principal del anexo.
    this.writeCotizantesSheet(workbook, draft);
    this.writeEncabezadoSheet(workbook, draft);
    this.writeArchivoPlanoSheet(workbook, draft, opts.version);
    this.writeTotalesSheet(workbook, draft);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const suggestedFileName = `pila-E-${draft.aportante.nit}-${draft.aportante.periodHealth}-v${opts.version}-anexo2-revision.xlsx`;

    return {
      bytes,
      mimeType: PILA_MIME_XLSX,
      suggestedFileName,
    };
  }

  private writeCotizantesSheet(workbook: ExcelJS.Workbook, draft: PilaPeriodDraft): void {
    const sheet = workbook.addWorksheet('Cotizantes (tipo 2)', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
      'Secuencia',
      'Tipo registro',
      'Tipo doc (c3)',
      'Documento (c4)',
      'Tipo cotizante (c5)',
      'Subtipo (c6)',
      'Depto DIVIPOLA (c9)',
      'Mpio DIVIPOLA (c10)',
      'Primer apellido (c11)',
      'Segundo apellido (c12)',
      'Primer nombre (c13)',
      'Segundo nombre (c14)',
      'AFP (c31)',
      'EPS (c33)',
      'CCF (c35)',
      'Días pensión (c36)',
      'Días salud (c37)',
      'Días ARL (c38)',
      'Días CCF (c39)',
      'Salario (c40)',
      'Salario integral (c41)',
      'IBC pensión (c42)',
      'IBC salud (c43)',
      'IBC ARL (c44)',
      'IBC CCF (c45)',
      'Tarifa pensión % (c46)',
      'Cotización pensión (c47)',
      'Total pensión (c50)',
      'Tarifa salud % (c54)',
      'Cotización salud (c55)',
      'Tarifa ARL % (c61)',
      'Centro trabajo (c62)',
      'Cotización ARL (c63)',
      'Tarifa CCF % (c64)',
      'Cotización CCF (c65)',
      'Tarifa SENA % (c66)',
      'Cotización SENA (c67)',
      'Tarifa ICBF % (c68)',
      'Cotización ICBF (c69)',
      'Exonerado Ley 1607 (c76)',
      'ARL cotizante (c77)',
      'Clase riesgo',
      'Actividad económica ARL',
      'Ciudad sede',
      'EmployeeId',
      'Tipo contrato',
      'Tipo salario',
      'Salud empleado (desglose)',
      'Salud empleador (desglose)',
      'Pensión empleado (desglose)',
      'Pensión empleador (desglose)',
    ] as const;

    sheet.columns = headers.map((h) => ({
      header: h,
      width: Math.min(28, Math.max(12, h.length + 1)),
    }));
    sheet.getRow(1).font = { bold: true };

    draft.cotizantes.forEach((c, index) => {
      const contrib = c.contributions;
      const days = Math.min(30, Math.max(0, Math.round(c.workedDays)));
      const ibc = c.contributionBase;
      const pensionCotizacion = contrib.employeePension + contrib.employerPension;
      const healthCotizacion = contrib.employeeHealth + contrib.employerHealth;
      const pensionTariff = contrib.employeePensionPct + contrib.employerPensionPct;
      const healthTariff = contrib.employeeHealthPct + contrib.employerHealthPct;

      sheet.addRow([
        index + 1,
        '02',
        c.documentType,
        c.documentNumber,
        c.tipoCotizante,
        '',
        c.departmentCode,
        c.municipalityCode,
        c.firstLastName,
        c.secondLastName ?? '',
        c.firstName,
        '',
        c.afpCode,
        c.epsCode,
        c.ccfCode,
        days,
        days,
        days,
        days,
        c.salaryAmount,
        c.isIntegralSalary ? 'X' : '',
        ibc,
        ibc,
        ibc,
        ibc,
        pensionTariff,
        pensionCotizacion,
        pensionCotizacion,
        healthTariff,
        healthCotizacion,
        contrib.employerArlPct,
        c.workCenterCode,
        contrib.employerArl,
        contrib.employerCajaPct,
        contrib.employerCaja,
        contrib.employerSenaPct,
        contrib.employerSena,
        contrib.employerIcbfPct,
        contrib.employerIcbf,
        'N',
        c.arlCode,
        c.arlRiskClass,
        c.actividadEconomicaArl,
        c.locationCityName ?? '',
        c.employeeId,
        c.contractType,
        c.salaryType,
        contrib.employeeHealth,
        contrib.employerHealth,
        contrib.employeePension,
        contrib.employerPension,
      ]);
    });
  }

  private writeEncabezadoSheet(workbook: ExcelJS.Workbook, draft: PilaPeriodDraft): void {
    const sheet = workbook.addWorksheet('Encabezado (tipo 1)');
    sheet.columns = [
      { header: 'Campo Anexo 2', key: 'campo', width: 40 },
      { header: 'Valor', key: 'valor', width: 48 },
    ];
    const a = draft.aportante;
    const totalIbc = draft.cotizantes.reduce((sum, c) => sum + c.contributionBase, 0);
    const rows: Array<[string, string | number]> = [
      ['c1 Tipo registro', '01'],
      ['c2 Modalidad', '1 (electrónica)'],
      ['c3 Secuencia', 1],
      ['c4 Razón social', a.legalName],
      ['c5 Tipo documento aportante', a.documentType],
      ['c6 NIT', a.nit],
      ['c7 Dígito verificación', a.verificationDigit],
      ['c8 Tipo planilla', a.tipoPlanilla],
      ['c11 Forma presentación', a.formaPresentacion],
      ['c14 Código ARL aportante', a.arlCode],
      ['c15 Período otros', a.periodOther],
      ['c16 Período salud', a.periodHealth],
      ['c19 Nº cotizantes', draft.totals.employeeCount],
      ['c20 Total IBC parafiscales', Math.round(totalIbc)],
      ['c21 Tipo aportante', a.tipoAportante],
      ['Clase aportante', a.claseAportante],
      ['Naturaleza jurídica', a.naturalezaJuridica],
      ['Actividad económica ARL', a.actividadEconomicaArl],
      ['Exento Ley 1607', String(a.exemptFromHealthSenaIcbfLey1607)],
      ['Tenant ID', draft.tenantId],
      ['Período liquidación', draft.period],
    ];
    for (const [campo, valor] of rows) {
      sheet.addRow({ campo, valor: String(valor) });
    }
    sheet.getRow(1).font = { bold: true };
  }

  private writeArchivoPlanoSheet(
    workbook: ExcelJS.Workbook,
    draft: PilaPeriodDraft,
    version: number,
  ): void {
    const sheet = workbook.addWorksheet('Archivo plano (líneas)', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = [
      { header: 'Nº línea', key: 'n', width: 10 },
      { header: 'Tipo registro', key: 'tipo', width: 14 },
      { header: 'Longitud', key: 'len', width: 10 },
      { header: 'Contenido fixed-width (igual al TXT)', key: 'contenido', width: 120 },
    ];
    sheet.getRow(1).font = { bold: true };

    const flat = this.flatSerializer.serialize(draft, { version });
    const text = flat.bytes.toString('latin1');
    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

    lines.forEach((line, index) => {
      sheet.addRow({
        n: index + 1,
        tipo: line.slice(0, 2),
        len: line.length,
        contenido: line,
      });
    });
  }

  private writeTotalesSheet(workbook: ExcelJS.Workbook, draft: PilaPeriodDraft): void {
    const sheet = workbook.addWorksheet('Totales');
    sheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 36 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];
    const t = draft.totals;
    sheet.addRow({ concepto: 'Empleados / cotizantes', valor: t.employeeCount });
    sheet.addRow({ concepto: 'Total costo nómina', valor: t.totalPayrollCost });
    sheet.addRow({ concepto: 'Total aportes empleados', valor: t.totalEmployeeContributions });
    sheet.addRow({ concepto: 'Total aportes empleador', valor: t.totalEmployerContributions });
    sheet.addRow({
      concepto: 'Total aportes',
      valor: t.totalEmployeeContributions + t.totalEmployerContributions,
    });
    sheet.getRow(1).font = { bold: true };
  }
}
