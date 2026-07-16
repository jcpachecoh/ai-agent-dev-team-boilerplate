import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ExcelJS from 'exceljs';

import { buildCleanPilaDraft } from '../pila/serializer/fixtures/pila-clean-draft.fixture';
import { PilaFixedWidthSerializer } from '../pila/serializer/pila-fixed-width.serializer';
import {
  PILA_XLSX_DATA_START_ROW,
  PILA_XLSX_MAX_EMPLOYEES,
  PILA_XLSX_SHEET_CATALOG,
  PILA_XLSX_SHEET_LIQUIDACIONES,
  PILA_XLSX_TEMPLATE_VERSION,
} from '../pila/serializer/pila-xlsx-catalog.maps';
import {
  loadTemplateBytes,
  PilaXlsxSerializationError,
  PilaXlsxSerializer,
} from '../pila/serializer/pila-xlsx.serializer';

const docsTemplatePath = join(__dirname, '../../../docs/PlantillaXLSX..xlsx');

describe('PilaXlsxSerializer', () => {
  const serializer = new PilaXlsxSerializer();
  const txtSerializer = new PilaFixedWidthSerializer();

  it('mismo draft alimenta TXT y XLSX con iguales empleados y totales', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 2 });
    const draftJson = JSON.stringify(draft);

    const txt = txtSerializer.serialize(draft, { version: 1 });
    const xlsx = await serializer.serializeAsync(draft, { version: 1 });

    expect(JSON.stringify(draft)).toBe(draftJson);
    expect(txt.lineCount).toBe(draft.cotizantes.length + 1);
    expect(xlsx.lineCount).toBe(draft.cotizantes.length + 1);
    expect(draft.totals.employeeCount).toBe(2);
    expect(xlsx.templateVersion).toBe(PILA_XLSX_TEMPLATE_VERSION);
  });

  it('TXT golden permanece byte-identical', () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    const result = txtSerializer.serialize(draft);
    const golden = readFileSync(
      join(__dirname, '../pila/serializer/fixtures/golden/pila-clean-one-employee.txt'),
    );
    expect(Buffer.compare(result.bytes, golden)).toBe(0);
  });

  it('XLSX con 20 empleados genera correctamente', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 20 });
    const out = await serializer.serializeAsync(draft);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);
    const sheet = wb.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES)!;
    expect(sheet.getCell(`C${PILA_XLSX_DATA_START_ROW}`).value).toBe('1234567890');
    expect(sheet.getCell(`C${PILA_XLSX_DATA_START_ROW + 19}`).value).toBeTruthy();
  });

  it('XLSX con 21 empleados bloquea con ERR_PILA_XLSX_EMPLOYEE_LIMIT', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 21 });
    try {
      await serializer.serializeAsync(draft);
      fail('expected PilaXlsxSerializationError');
    } catch (err) {
      expect(err).toBeInstanceOf(PilaXlsxSerializationError);
      const e = err as PilaXlsxSerializationError;
      expect(e.details.code).toBe('ERR_PILA_XLSX_EMPLOYEE_LIMIT');
      expect(e.details.actualCount).toBe(21);
      expect(e.details.maxAllowed).toBe(PILA_XLSX_MAX_EMPLOYEES);
      expect(e.message).toMatch(/TXT/i);
    }
  });

  it('TXT permanece disponible con 21 empleados', () => {
    const draft = buildCleanPilaDraft({ employeeCount: 21 });
    const txt = txtSerializer.serialize(draft);
    expect(txt.lineCount).toBe(22);
    expect(txt.bytes.byteLength).toBeGreaterThan(0);
  });

  it('plantilla original en docs no cambia tras serializar', async () => {
    const before = createHash('sha256').update(readFileSync(docsTemplatePath)).digest('hex');
    await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 1 }));
    await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 3 }));
    const after = createHash('sha256').update(readFileSync(docsTemplatePath)).digest('hex');
    expect(after).toBe(before);
  });

  it('múltiples generaciones no mutan el asset runtime', async () => {
    const before = createHash('sha256').update(loadTemplateBytes()).digest('hex');
    const a = await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 1 }));
    const b = await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 2 }));
    const after = createHash('sha256').update(loadTemplateBytes()).digest('hex');
    expect(after).toBe(before);
    expect(Buffer.compare(a.bytes, b.bytes)).not.toBe(0);
  });

  it('archivo generado conserva veryHidden, protección, validaciones, estilos, anchos y merges', async () => {
    const templateWb = new ExcelJS.Workbook();
    await templateWb.xlsx.load(loadTemplateBytes() as unknown as ExcelJS.Buffer);
    const templateLiq = templateWb.getWorksheet(
      PILA_XLSX_SHEET_LIQUIDACIONES,
    )! as ExcelJS.Worksheet & {
      dataValidations?: { model?: Record<string, unknown> };
      sheetProtection?: unknown;
    };
    const templateCatalog = templateWb.getWorksheet(PILA_XLSX_SHEET_CATALOG)!;
    const templateDvKeys = Object.keys(templateLiq.dataValidations?.model ?? {});
    const templateMerges = [...(templateLiq.model.merges ?? [])].sort();
    const templateWidthA = templateLiq.getColumn(1).width;
    const templateWidthH = templateLiq.getColumn(8).width;
    const unlockedSample = templateLiq.getCell('C19').protection?.locked;

    const out = await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 1 }));
    const outWb = new ExcelJS.Workbook();
    await outWb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);
    const outLiq = outWb.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES)! as ExcelJS.Worksheet & {
      dataValidations?: { model?: Record<string, unknown> };
      sheetProtection?: unknown;
    };
    const outCatalog = outWb.getWorksheet(PILA_XLSX_SHEET_CATALOG)!;

    expect(outCatalog.state).toBe('veryHidden');
    expect(outCatalog.state).toBe(templateCatalog.state);
    expect(outLiq.sheetProtection).toBeTruthy();
    expect(!!outLiq.sheetProtection).toBe(!!templateLiq.sheetProtection);
    expect(Object.keys(outLiq.dataValidations?.model ?? {}).length).toBe(templateDvKeys.length);
    expect([...(outLiq.model.merges ?? [])].sort()).toEqual(templateMerges);
    expect(outLiq.getColumn(1).width).toBe(templateWidthA);
    expect(outLiq.getColumn(8).width).toBe(templateWidthH);
    expect(outLiq.getCell('C19').protection?.locked).toBe(unlockedSample);
    // Estilo de encabezado de datos (fila 17) se conserva
    expect(outLiq.getRow(17).font?.bold).toBe(templateLiq.getRow(17).font?.bold);
  });

  it('filas no usadas quedan limpias (sin documento ni montos)', async () => {
    const out = await serializer.serializeAsync(buildCleanPilaDraft({ employeeCount: 1 }));
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);
    const sheet = wb.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES)!;
    expect(sheet.getCell(`C${PILA_XLSX_DATA_START_ROW + 1}`).value).toBeNull();
    expect(sheet.getCell(`AU${PILA_XLSX_DATA_START_ROW + 1}`).value).toBeNull();
    expect(sheet.getCell(`AX${PILA_XLSX_DATA_START_ROW + 1}`).value).toBe('NINGUNA');
  });

  it('ciudad no mapeada bloquea con detalle accionable', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].departmentCode = '05';
    draft.cotizantes[0].locationCityName = 'CIUDAD_INEXISTENTE_XYZ';
    try {
      await serializer.serializeAsync(draft);
      fail('expected catalog mismatch');
    } catch (err) {
      expect(err).toBeInstanceOf(PilaXlsxSerializationError);
      const e = err as PilaXlsxSerializationError;
      expect(e.details.code).toBe('ERR_PILA_XLSX_CATALOG_MISMATCH');
      expect(e.details.internalValue).toContain('CIUDAD_INEXISTENTE');
      expect(e.details.employeeId).toBe('emp-1');
      expect(e.details.recommendedAction).toMatch(/TXT/i);
    }
  });

  it('administradora no mapeada bloquea con valor interno', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].epsCode = 'EPS999';
    try {
      await serializer.serializeAsync(draft);
      fail('expected catalog mismatch');
    } catch (err) {
      expect(err).toBeInstanceOf(PilaXlsxSerializationError);
      const e = err as PilaXlsxSerializationError;
      expect(e.details.code).toBe('ERR_PILA_XLSX_CATALOG_MISMATCH');
      expect(e.details.internalValue).toBe('EPS999');
      expect(e.details.employeeId).toBe('emp-1');
    }
  });

  it('Bogotá con ciudad inventada bloquea sin fuzzy', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].departmentCode = '11';
    draft.cotizantes[0].locationCityName = 'CIUDAD_BOGOTA_FAKE';
    await expect(serializer.serializeAsync(draft)).rejects.toMatchObject({
      details: expect.objectContaining({ code: 'ERR_PILA_XLSX_CATALOG_MISMATCH' }),
    });
  });

  it('depto no-Bogotá sin ciudad bloquea', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].departmentCode = '05';
    draft.cotizantes[0].locationCityName = null;
    await expect(serializer.serializeAsync(draft)).rejects.toMatchObject({
      field: 'locationCityName',
      details: expect.objectContaining({ code: 'ERR_PILA_XLSX_CATALOG_MISMATCH' }),
    });
  });

  it('depto no-Bogotá con ciudad exacta de catálogo genera', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].departmentCode = '05';
    draft.cotizantes[0].locationCityName = 'ABEJORRAL';
    const out = await serializer.serializeAsync(draft);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);
    const sheet = wb.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES)!;
    expect(sheet.getCell(`H${PILA_XLSX_DATA_START_ROW}`).value).toBe('ANTIOQUIA');
    expect(sheet.getCell(`I${PILA_XLSX_DATA_START_ROW}`).value).toBe('ABEJORRAL');
  });

  it('Bogotá acepta ciudad BOGOTA', async () => {
    const draft = buildCleanPilaDraft({ employeeCount: 1 });
    draft.cotizantes[0].locationCityName = 'BOGOTA';
    const out = await serializer.serializeAsync(draft);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);
    const sheet = wb.getWorksheet(PILA_XLSX_SHEET_LIQUIDACIONES)!;
    expect(sheet.getCell(`I${PILA_XLSX_DATA_START_ROW}`).value).toBe('BOGOTA');
  });
});
