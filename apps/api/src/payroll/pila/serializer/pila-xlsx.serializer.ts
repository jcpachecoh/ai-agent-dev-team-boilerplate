import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import ExcelJS from 'exceljs';

import type { PilaCotizanteDraft, PilaPeriodDraft } from '../pila-preparation.interfaces';
import {
  PILA_XLSX_ALTO_RIESGO_SIN,
  PILA_XLSX_APORTANTE_EMPLEADOR,
  PILA_XLSX_AFP_BY_CODE,
  PILA_XLSX_ARL_BY_CODE,
  PILA_XLSX_CATALOG_COLUMNS,
  PILA_XLSX_CCF_BY_CODE,
  PILA_XLSX_CORRECCIONES_NO,
  PILA_XLSX_COTIZANTE_01_LABEL,
  PILA_XLSX_DATA_START_ROW,
  PILA_XLSX_DEPARTMENT_BY_CODE,
  PILA_XLSX_EPS_BY_CODE,
  PILA_XLSX_MAX_EMPLOYEES,
  PILA_XLSX_NO,
  PILA_XLSX_PLANILLA_E_LABEL,
  PILA_XLSX_SHEET_CATALOG,
  PILA_XLSX_SHEET_LIQUIDACIONES,
  PILA_XLSX_SI,
  PILA_XLSX_SUBTIPO_NINGUNO,
  PILA_XLSX_TEMPLATE_FILE,
  PILA_XLSX_TEMPLATE_VERSION,
  PilaXlsxSerializationError,
  resolveXlsxLabel,
} from './pila-xlsx-catalog.maps';

export type PilaXlsxSerializeResult = {
  bytes: Buffer;
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  encoding: 'binary';
  lineCount: number;
  byteLength: number;
  suggestedFileName: string;
  templateVersion: string;
};

export { PilaXlsxSerializationError };

type CatalogLabelSets = {
  afp: Set<string>;
  eps: Set<string>;
  ccf: Set<string>;
  arl: Set<string>;
  department: Set<string>;
  /** Todas las celdas texto de la hoja catálogo (ciudades y demás listas). */
  allLabels: Set<string>;
};

/**
 * Serializa PilaPeriodDraft sobre la plantilla oficial Aportes en Línea.
 * No reconstruye el workbook: carga el XLSX base y solo escribe celdas de entrada.
 *
 * Mapas código→etiqueta: necesarios porque `DatosPruebaEmp` solo expone nombres;
 * TXT usa códigos UGPP. La hoja se lee para validar membresía exacta (sin fuzzy).
 */
export class PilaXlsxSerializer {
  async serializeAsync(
    draft: PilaPeriodDraft,
    options?: { version?: number; batchIndex?: number; batchTotal?: number },
  ): Promise<PilaXlsxSerializeResult> {
    const actualCount = draft.cotizantes.length;
    if (actualCount > PILA_XLSX_MAX_EMPLOYEES) {
      throw new PilaXlsxSerializationError(
        'cotizantes',
        `La plantilla XLSX Aportes en Línea admite máximo ${PILA_XLSX_MAX_EMPLOYEES} empleados por archivo; este lote tiene ${actualCount}. Divide en lotes de ${PILA_XLSX_MAX_EMPLOYEES} antes de serializar.`,
        {
          code: 'ERR_PILA_XLSX_EMPLOYEE_LIMIT',
          actualCount,
          maxAllowed: PILA_XLSX_MAX_EMPLOYEES,
          recommendedAction:
            'El export service debe partir el draft en lotes de 20 (ZIP multi-archivo).',
        },
      );
    }

    const templateBytes = loadTemplateBytes();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBytes as unknown as ExcelJS.Buffer);

    const catalog = workbook.getWorksheet(PILA_XLSX_SHEET_CATALOG);
    const liquidaciones = workbook.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES);
    if (!catalog || !liquidaciones) {
      throw new PilaXlsxSerializationError(
        'template',
        'Plantilla incompleta: faltan hojas DatosPruebaEmp / Liquidaciones',
        { code: 'ERR_PILA_XLSX_SERIALIZE' },
      );
    }

    const catalogLabels = readCatalogLabelSets(catalog);

    this.fillHeader(liquidaciones, draft, catalogLabels);
    this.fillEmployees(liquidaciones, draft, catalogLabels);
    this.clearUnusedEmployeeRows(liquidaciones, draft.cotizantes.length);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const version = options?.version ?? 1;
    const batchIndex = options?.batchIndex;
    const batchTotal = options?.batchTotal;
    const batchSuffix =
      batchIndex && batchTotal && batchTotal > 1
        ? `-lote-${String(batchIndex).padStart(2, '0')}-de-${String(batchTotal).padStart(2, '0')}`
        : '';
    return {
      bytes: buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      encoding: 'binary',
      lineCount: draft.cotizantes.length + 1,
      byteLength: buffer.byteLength,
      suggestedFileName: `pila-E-${draft.aportante.nit}-${draft.aportante.periodHealth}-v${version}${batchSuffix}.xlsx`,
      templateVersion: PILA_XLSX_TEMPLATE_VERSION,
    };
  }

  private fillHeader(
    sheet: ExcelJS.Worksheet,
    draft: PilaPeriodDraft,
    catalog: CatalogLabelSets,
  ): void {
    const a = draft.aportante;
    sheet.getCell('A10').value = a.periodOther;
    sheet.getCell('C10').value = a.periodHealth;
    sheet.getCell('D10').value = PILA_XLSX_PLANILLA_E_LABEL;
    sheet.getCell('I10').value = PILA_XLSX_APORTANTE_EMPLEADOR;
    const arl = resolveXlsxLabel(PILA_XLSX_ARL_BY_CODE, a.arlCode, 'aportante.arlCode', {
      catalogSample: [...catalog.arl].slice(0, 8),
    });
    assertLabelInCatalog(arl, catalog.arl, 'aportante.arlCode', a.arlCode);
    sheet.getCell('K10').value = arl;
  }

  private fillEmployees(
    sheet: ExcelJS.Worksheet,
    draft: PilaPeriodDraft,
    catalog: CatalogLabelSets,
  ): void {
    draft.cotizantes.forEach((c, index) => {
      const row = PILA_XLSX_DATA_START_ROW + index;
      const ctx = {
        employeeId: c.employeeId,
        employeeName: `${c.firstName} ${c.firstLastName}`.trim(),
      };
      const days = Math.min(30, Math.max(0, Math.round(c.workedDays)));
      const hours = Math.min(999, days * 8);
      const ibc = Math.round(c.contributionBase);
      const salary = Math.round(c.salaryAmount);
      const pensionTariff = c.contributions.employeePensionPct + c.contributions.employerPensionPct;
      const healthTariff = c.contributions.employeeHealthPct + c.contributions.employerHealthPct;
      const pensionValue = Math.round(
        c.contributions.employeePension + c.contributions.employerPension,
      );
      const healthValue = Math.round(
        c.contributions.employeeHealth + c.contributions.employerHealth,
      );

      const dept = resolveXlsxLabel(
        PILA_XLSX_DEPARTMENT_BY_CODE,
        c.departmentCode,
        'departmentCode',
        {
          ...ctx,
          catalogSample: [...catalog.department].slice(0, 8),
        },
      );
      assertLabelInCatalog(dept, catalog.department, 'departmentCode', c.departmentCode, ctx);

      const city = resolveCityForXlsx(c, catalog);

      const afp = resolveXlsxLabel(PILA_XLSX_AFP_BY_CODE, c.afpCode, 'afpCode', {
        ...ctx,
        catalogSample: [...catalog.afp].slice(0, 8),
      });
      assertLabelInCatalog(afp, catalog.afp, 'afpCode', c.afpCode, ctx);

      const eps = resolveXlsxLabel(PILA_XLSX_EPS_BY_CODE, c.epsCode, 'epsCode', {
        ...ctx,
        catalogSample: [...catalog.eps].slice(0, 8),
      });
      assertLabelInCatalog(eps, catalog.eps, 'epsCode', c.epsCode, ctx);

      const arl = resolveXlsxLabel(PILA_XLSX_ARL_BY_CODE, c.arlCode, 'arlCode', {
        ...ctx,
        catalogSample: [...catalog.arl].slice(0, 8),
      });
      assertLabelInCatalog(arl, catalog.arl, 'arlCode', c.arlCode, ctx);

      const ccf = resolveXlsxLabel(PILA_XLSX_CCF_BY_CODE, c.ccfCode, 'ccfCode', {
        ...ctx,
        catalogSample: [...catalog.ccf].slice(0, 8),
      });
      assertLabelInCatalog(ccf, catalog.ccf, 'ccfCode', c.ccfCode, ctx);

      set(sheet, row, 'A', index + 1);
      set(sheet, row, 'B', c.documentType);
      set(sheet, row, 'C', c.documentNumber);
      set(sheet, row, 'D', c.firstLastName);
      set(sheet, row, 'E', c.secondLastName ?? '');
      set(sheet, row, 'F', c.firstName);
      set(sheet, row, 'G', '');
      set(sheet, row, 'H', dept);
      set(sheet, row, 'I', city);
      set(sheet, row, 'J', PILA_XLSX_COTIZANTE_01_LABEL);
      set(sheet, row, 'K', PILA_XLSX_SUBTIPO_NINGUNO);
      set(sheet, row, 'L', hours);
      set(sheet, row, 'M', PILA_XLSX_NO);
      set(sheet, row, 'N', PILA_XLSX_NO);
      set(sheet, row, 'O', null);
      for (const col of [
        'P',
        'R',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Z',
        'AA',
        'AD',
        'AG',
        'AJ',
        'AM',
        'AN',
      ] as const) {
        set(sheet, row, col, PILA_XLSX_NO);
      }
      set(sheet, row, 'AQ', PILA_XLSX_NO);
      set(sheet, row, 'AT', PILA_XLSX_CORRECCIONES_NO);
      set(sheet, row, 'AU', salary);
      set(sheet, row, 'AV', c.isIntegralSalary ? PILA_XLSX_SI : PILA_XLSX_NO);
      set(sheet, row, 'AW', PILA_XLSX_NO);
      set(sheet, row, 'AX', afp);
      set(sheet, row, 'AY', days);
      set(sheet, row, 'AZ', ibc);
      set(sheet, row, 'BA', pensionTariff);
      set(sheet, row, 'BB', pensionValue);
      set(sheet, row, 'BC', PILA_XLSX_ALTO_RIESGO_SIN);
      set(sheet, row, 'BI', pensionValue);
      set(sheet, row, 'BK', eps);
      set(sheet, row, 'BL', days);
      set(sheet, row, 'BM', ibc);
      set(sheet, row, 'BN', healthTariff);
      set(sheet, row, 'BO', healthValue);
      set(sheet, row, 'BV', arl);
      set(sheet, row, 'BW', days);
      set(sheet, row, 'BX', ibc);
      set(sheet, row, 'BY', c.contributions.employerArlPct);
      set(sheet, row, 'BZ', c.arlRiskClass);
      set(sheet, row, 'CA', Number(c.workCenterCode.replace(/\D/g, '') || '0'));
      set(sheet, row, 'CB', Number(c.actividadEconomicaArl));
      set(sheet, row, 'CC', Math.round(c.contributions.employerArl));
      set(sheet, row, 'CD', days);
      set(sheet, row, 'CE', ccf);
      set(sheet, row, 'CF', ibc);
      set(sheet, row, 'CG', c.contributions.employerCajaPct);
      set(sheet, row, 'CH', Math.round(c.contributions.employerCaja));
      set(sheet, row, 'CI', ibc);
      set(sheet, row, 'CJ', c.contributions.employerSenaPct);
      set(sheet, row, 'CK', Math.round(c.contributions.employerSena));
      set(sheet, row, 'CL', c.contributions.employerIcbfPct);
      set(sheet, row, 'CM', Math.round(c.contributions.employerIcbf));
      set(sheet, row, 'CR', PILA_XLSX_NO);
    });
  }

  /**
   * Filas no usadas: deja placeholders mínimos de plantilla (listas desplegables)
   * y limpia campos de identificación/montos — sin inventar cotizantes.
   */
  private clearUnusedEmployeeRows(sheet: ExcelJS.Worksheet, usedCount: number): void {
    for (let i = usedCount; i < PILA_XLSX_MAX_EMPLOYEES; i++) {
      const row = PILA_XLSX_DATA_START_ROW + i;
      set(sheet, row, 'A', i + 1);
      for (const col of [
        'C',
        'D',
        'E',
        'F',
        'G',
        'L',
        'O',
        'AU',
        'AY',
        'AZ',
        'BA',
        'BB',
        'BI',
        'BL',
        'BM',
        'BN',
        'BO',
        'BW',
        'BX',
        'BY',
        'BZ',
        'CA',
        'CB',
        'CC',
        'CD',
        'CF',
        'CG',
        'CH',
        'CI',
        'CJ',
        'CK',
        'CL',
        'CM',
      ] as const) {
        set(sheet, row, col, null);
      }
      set(sheet, row, 'B', 'CC');
      set(sheet, row, 'H', 'AMAZONAS');
      set(sheet, row, 'I', 'EL ENCANTO');
      set(sheet, row, 'J', PILA_XLSX_COTIZANTE_01_LABEL);
      set(sheet, row, 'K', PILA_XLSX_SUBTIPO_NINGUNO);
      set(sheet, row, 'M', PILA_XLSX_NO);
      set(sheet, row, 'N', PILA_XLSX_NO);
      set(sheet, row, 'P', PILA_XLSX_NO);
      set(sheet, row, 'R', PILA_XLSX_NO);
      set(sheet, row, 'AX', 'NINGUNA');
      set(sheet, row, 'BK', 'NINGUNA');
      set(sheet, row, 'BV', 'NINGUNA');
      set(sheet, row, 'CE', 'NINGUNA');
      set(sheet, row, 'AV', PILA_XLSX_NO);
      set(sheet, row, 'AW', PILA_XLSX_NO);
      set(sheet, row, 'AT', PILA_XLSX_CORRECCIONES_NO);
      set(sheet, row, 'CR', PILA_XLSX_NO);
    }
  }
}

function set(sheet: ExcelJS.Worksheet, row: number, col: string, value: ExcelJS.CellValue): void {
  sheet.getCell(`${col}${row}`).value = value;
}

function readCatalogLabelSets(sheet: ExcelJS.Worksheet): CatalogLabelSets {
  const readCol = (col: number): Set<string> => {
    const set = new Set<string>();
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) {
        return;
      }
      const raw = row.getCell(col).value;
      const text = cellToTrimmedString(raw);
      if (text) {
        set.add(text);
      }
    });
    return set;
  };

  const allLabels = new Set<string>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 3) {
      return;
    }
    row.eachCell((cell) => {
      const text = cellToTrimmedString(cell.value);
      if (text) {
        allLabels.add(text);
      }
    });
  });

  return {
    afp: readCol(PILA_XLSX_CATALOG_COLUMNS.afp),
    eps: readCol(PILA_XLSX_CATALOG_COLUMNS.eps),
    ccf: readCol(PILA_XLSX_CATALOG_COLUMNS.ccf),
    arl: readCol(PILA_XLSX_CATALOG_COLUMNS.arl),
    department: readCol(PILA_XLSX_CATALOG_COLUMNS.department),
    allLabels,
  };
}

function cellToTrimmedString(value: ExcelJS.CellValue): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    const text = value.text.trim();
    return text.length > 0 ? text : null;
  }
  return null;
}

function assertLabelInCatalog(
  label: string,
  catalog: Set<string>,
  field: string,
  internalCode: string,
  ctx?: { employeeId?: string; employeeName?: string },
): void {
  if (catalog.has(label)) {
    return;
  }
  const sample = [...catalog].slice(0, 8).join(', ');
  throw new PilaXlsxSerializationError(
    field,
    `La etiqueta "${label}" (código interno "${internalCode}") no está en DatosPruebaEmp.` +
      (sample ? ` Ejemplos: ${sample}.` : '') +
      ' Sin fuzzy match: corrige el maestro o usa TXT.',
    {
      code: 'ERR_PILA_XLSX_CATALOG_MISMATCH',
      internalValue: internalCode,
      expectedHint: sample || 'etiqueta exacta de DatosPruebaEmp',
      employeeId: ctx?.employeeId,
      employeeName: ctx?.employeeName,
      recommendedAction:
        'Verifica pilaCode / nombre de sede contra la plantilla, o genera archivo plano TXT.',
    },
  );
}

/**
 * Bogotá D.C. (11): lista de una sola celda; ciudad puede ir vacía.
 * Otros: `locationCityName` exacto presente en DatosPruebaEmp — sin fuzzy.
 */
function resolveCityForXlsx(c: PilaCotizanteDraft, catalog: CatalogLabelSets): string {
  const ctx = {
    employeeId: c.employeeId,
    employeeName: `${c.firstName} ${c.firstLastName}`.trim(),
  };
  if (c.departmentCode === '11') {
    if (!c.locationCityName?.trim()) {
      return '';
    }
    const city = c.locationCityName.trim().toUpperCase();
    if (!catalog.allLabels.has(city) && city !== 'BOGOTA' && city !== 'BOGOTÁ') {
      throw new PilaXlsxSerializationError(
        'locationCityName',
        `Ciudad "${city}" no está en el catálogo de la plantilla (empleado ${ctx.employeeName}). Usa el nombre exacto de la lista o deja vacío en Bogotá.`,
        {
          code: 'ERR_PILA_XLSX_CATALOG_MISMATCH',
          internalValue: city,
          expectedHint: 'nombre exacto en DatosPruebaEmp (o vacío para Bogotá D.C.)',
          ...ctx,
          recommendedAction:
            'Ajusta el nombre de ciudad/sede al valor exacto de la plantilla, o genera TXT.',
        },
      );
    }
    return city;
  }
  const city = c.locationCityName?.trim();
  if (!city) {
    throw new PilaXlsxSerializationError(
      'locationCityName',
      `Ciudad de sede requerida para XLSX (empleado ${ctx.employeeName}, depto ${c.departmentCode}). Debe coincidir exactamente con la lista de la plantilla.`,
      {
        code: 'ERR_PILA_XLSX_CATALOG_MISMATCH',
        internalValue: '',
        expectedHint: 'nombre exacto de ciudad en DatosPruebaEmp',
        ...ctx,
        recommendedAction:
          'Completa location/city con el nombre exacto de la plantilla, o genera TXT.',
      },
    );
  }
  const normalized = city.toUpperCase();
  if (!catalog.allLabels.has(normalized)) {
    throw new PilaXlsxSerializationError(
      'locationCityName',
      `Ciudad "${normalized}" no está en DatosPruebaEmp (empleado ${ctx.employeeName}). Sin fuzzy match.`,
      {
        code: 'ERR_PILA_XLSX_CATALOG_MISMATCH',
        internalValue: normalized,
        expectedHint: 'nombre exacto de ciudad en DatosPruebaEmp',
        ...ctx,
        recommendedAction:
          'Usa el nombre exacto de la lista de la plantilla para la sede, o genera TXT.',
      },
    );
  }
  return normalized;
}

function loadTemplateBytes(): Buffer {
  const candidates = [
    join(__dirname, '..', 'templates', PILA_XLSX_TEMPLATE_FILE),
    join(process.cwd(), 'src', 'payroll', 'pila', 'templates', PILA_XLSX_TEMPLATE_FILE),
    join(
      process.cwd(),
      'apps',
      'api',
      'src',
      'payroll',
      'pila',
      'templates',
      PILA_XLSX_TEMPLATE_FILE,
    ),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate);
    }
  }
  throw new PilaXlsxSerializationError(
    'template',
    `No se encontró ${PILA_XLSX_TEMPLATE_FILE} en rutas de runtime`,
    { code: 'ERR_PILA_XLSX_SERIALIZE' },
  );
}

export { loadTemplateBytes };
