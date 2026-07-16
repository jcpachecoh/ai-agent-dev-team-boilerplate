/**
 * Genera artefactos sintéticos TXT + XLSX para validación manual en Aportes en Línea.
 * NO son comprobantes reales. Datos de fixture controlados (sin PII real).
 *
 * Uso: node --import jiti/register apps/api/scripts/generate-os595-operator-samples.ts
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildCleanPilaDraft } from '../src/payroll/pila/serializer/fixtures/pila-clean-draft.fixture';
import { PilaFixedWidthSerializer } from '../src/payroll/pila/serializer/pila-fixed-width.serializer';
import { PILA_TECHNICAL_VERSION } from '../src/payroll/pila/serializer/pila-fixed-width.constants';
import { PILA_XLSX_TEMPLATE_VERSION } from '../src/payroll/pila/serializer/pila-xlsx-catalog.maps';
import { PilaXlsxSerializer } from '../src/payroll/pila/serializer/pila-xlsx.serializer';

async function main(): Promise<void> {
  const outDir = join(__dirname, '../tmp/os595-operator-validation');
  mkdirSync(outDir, { recursive: true });

  const draft = buildCleanPilaDraft({ employeeCount: 2, legalName: 'DEMO VALIDACION PILA SAS' });
  const txt = new PilaFixedWidthSerializer().serialize(draft, { version: 1 });
  const xlsx = await new PilaXlsxSerializer().serializeAsync(draft, { version: 1 });

  const txtName = 'VALIDACION-NO-REAL-pila-E-900000000-2026-07-v1.txt';
  const xlsxName = 'VALIDACION-NO-REAL-pila-E-900000000-2026-07-v1.xlsx';
  const txtPath = join(outDir, txtName);
  const xlsxPath = join(outDir, xlsxName);

  writeFileSync(txtPath, txt.bytes);
  writeFileSync(xlsxPath, xlsx.bytes);

  const totalContribution =
    draft.totals.totalEmployeeContributions + draft.totals.totalEmployerContributions;

  const manifest = {
    disclaimer:
      'Archivos de validación sintética OS-595. No son comprobantes reales ni contienen datos personales reales.',
    period: draft.aportante.periodHealth,
    periodOther: draft.aportante.periodOther,
    tenantId: draft.tenantId,
    employeeCount: draft.totals.employeeCount,
    totalPayroll: draft.totals.totalPayrollCost,
    totalContribution,
    files: [
      {
        format: 'TXT',
        path: txtPath,
        fileName: txtName,
        checksumSha256: createHash('sha256').update(txt.bytes).digest('hex'),
        technicalVersion: PILA_TECHNICAL_VERSION,
        byteLength: txt.byteLength,
      },
      {
        format: 'XLSX',
        path: xlsxPath,
        fileName: xlsxName,
        checksumSha256: createHash('sha256').update(xlsx.bytes).digest('hex'),
        templateVersion: PILA_XLSX_TEMPLATE_VERSION,
        byteLength: xlsx.byteLength,
      },
    ],
    operatorProcedure: [
      '1. Abrir Aportes en Línea (ambiente de pruebas si existe).',
      '2. Cargar primero el XLSX en el flujo de plantilla Excel.',
      '3. Cargar después el TXT en el flujo de archivo plano.',
      '4. NO confirmar pago ni ejecutar acciones irreversibles.',
      '5. Registrar aceptación/rechazo y mensaje exacto del operador.',
    ],
  };

  writeFileSync(join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(
    join(outDir, 'README.md'),
    [
      '# OS-595 — archivos de validación (NO REAL)',
      '',
      manifest.disclaimer,
      '',
      `Período: ${manifest.period} | Empleados: ${manifest.employeeCount}`,
      '',
      '## Procedimiento',
      ...manifest.operatorProcedure.map((l) => `- ${l}`),
      '',
    ].join('\n'),
  );

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
