# Task 03 — Export MVP (Excel + PDF)

## Objetivo

Agregar exportación de reportes a Excel (.xlsx) y PDF desde los endpoints de Task 02.
Mínimo viable: descarga directa (sin job queue async en la primera iteración).

Prerequisito: Task 02 completada y sus tests pasando.

---

## Contexto del análisis previo

### Dependencias de export existentes

| Paquete            | Instalado | Versión | Uso posible                                                   |
| ------------------ | --------- | ------- | ------------------------------------------------------------- |
| `pdfkit`           | ✅ SÍ     | ^0.17.2 | PDF programático (primitivas: texto, tablas manuales, líneas) |
| `bullmq`           | ✅ SÍ     | ^5.77.6 | Job queue para async (disponible si se necesita)              |
| `@nestjs/schedule` | ✅ SÍ     | ^6.1.3  | Cron jobs (disponible para cleanup de archivos temp)          |
| `exceljs`          | ❌ NO     | —       | Necesario para Excel con formato                              |
| `pdfmake`          | ❌ NO     | —       | Alternativa a pdfkit (no necesaria si pdfkit es suficiente)   |
| `puppeteer`        | ❌ NO     | —       | HTML→PDF (overhead grande, no recomendado para MVP)           |

### Decisión de dependencias

**Excel:** Agregar `exceljs` es necesario. No hay alternativa satisfactoria con dependencias existentes.

- Requiere aprobación explícita antes de `npm install`.
- Si no se aprueba, Excel queda como follow-up y Task 03 solo cubre PDF.

**PDF:** Usar `pdfkit` (ya instalado). Es suficiente para recibos y consolidados tabulares.

**BullMQ:** No usar en MVP. Los reportes son síncronos. Un reporte de 50 empleados genera en <2s.
Si el tenant crece a >500 empleados, migrar a BullMQ en Task 03-bis (documentado abajo).

**Storage:** Respuesta HTTP directa con headers `Content-Disposition: attachment`.
No se guardan archivos en disco ni S3. Elimina la necesidad de storage en MVP.

---

## Scope

### Endpoints a agregar (sobre los de Task 02)

| Método | Ruta                                                        | Formato | Descripción              |
| ------ | ----------------------------------------------------------- | ------- | ------------------------ |
| `GET`  | `/api/reports/payroll/export?format=xlsx&year=2026&month=6` | Excel   | Nómina mensual completa  |
| `GET`  | `/api/reports/payroll/export?format=pdf&year=2026&month=6`  | PDF     | Resumen de nómina en PDF |
| `GET`  | `/api/reports/attendance/export?format=xlsx`                | Excel   | Asistencia mensual       |
| `GET`  | `/api/reports/social-security/export?format=xlsx`           | Excel   | Planilla PILA para carga |

Se agrega `format` como query param al `ReportQueryDto` de Task 02.
Si `format` está presente, el endpoint responde con el archivo binario en lugar de JSON.

### Archivos a crear

```
apps/api/src/reports/
  service/
    report-excel.service.ts      ← genera buffers Excel con exceljs
    report-pdf.service.ts        ← genera buffers PDF con pdfkit
  test/
    report-excel.service.spec.ts
    report-pdf.service.spec.ts
```

### Archivos a modificar

```
apps/api/src/reports/controller/reports.controller.ts   ← agregar lógica de format
apps/api/src/reports/reports.module.ts                  ← declarar nuevos servicios
apps/api/package.json                                   ← agregar exceljs (con aprobación)
```

### Archivos prohibidos

- `schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/web-app/`
- `pnpm-lock.yaml` (se actualiza automáticamente al instalar)

---

## Diseño de `ReportExcelService`

```typescript
// Genera buffer .xlsx con una hoja por reporte
generatePayrollExcel(rows: EmployeePayrollPeriod[], period: { year, month }): Promise<Buffer>
generateAttendanceExcel(rows: AttendanceMonthSummary[], period): Promise<Buffer>
generateSocialSecurityExcel(rows: SocialSecurityReportItem[], period): Promise<Buffer>
```

**Estructura de la hoja de nómina:**

| Columna A | B      | C     | D             | E               | F            | G                   | H     | I          | J            | K    |
| --------- | ------ | ----- | ------------- | --------------- | ------------ | ------------------- | ----- | ---------- | ------------ | ---- |
| Cédula    | Nombre | Cargo | Tipo contrato | Días trabajados | Salario base | Subsidio transporte | Extra | Salud emp. | Pensión emp. | Neto |

Filas adicionales al final: totales por columna.

**Columnas PILA (social security):**

Usar estructura que coincida con operador PILA colombiano estándar (documentar fuente).

---

## Diseño de `ReportPdfService`

```typescript
generatePayrollPdf(rows: EmployeePayrollPeriod[], period, tenantName: string): Promise<Buffer>
```

**Layout del PDF (pdfkit):**

```
[Logo/cabecera si existe] — Empresa: {tenantName} — Periodo: Junio 2026
─────────────────────────────────────────────────────────────────────
Tabla: Cédula | Nombre | Días | Salario base | Subsidio | Extra | Deducciones | Neto
─────────────────────────────────────────────────────────────────────
Totales: X empleados | Total devengado: $ | Total deducciones: $ | Total neto: $
─────────────────────────────────────────────────────────────────────
Aportes patronales: Salud: $ | Pensión: $ | ARL: $ | SENA: $ | ICBF: $ | Caja: $
Costo total nómina: $
```

Para recibos individuales: una página por empleado con desglose completo.

---

## Manejo de response en el controller

```typescript
@Get('payroll/export')
async exportPayroll(
  @Query() query: ReportQueryDto & { format: 'xlsx' | 'pdf' },
  @Res() res: Response,
  @Tenant() tenantId: string,
) {
  const data = await this.reportsService.getPayrollReport(tenantId, query);
  const filename = `nomina-${query.year}-${String(query.month).padStart(2,'0')}`;

  if (query.format === 'xlsx') {
    const buffer = await this.excelService.generatePayrollExcel(data, query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    });
    return res.send(buffer);
  }

  if (query.format === 'pdf') {
    const buffer = await this.pdfService.generatePayrollPdf(data, query, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    });
    return res.send(buffer);
  }

  throw new BadRequestException('format must be xlsx or pdf');
}
```

---

## Si BullMQ es necesario (criterio)

Mover a async si se cumple alguna de estas condiciones:

- El reporte tarda >5 segundos en generarse (indica >200 empleados aproximadamente)
- Se requiere polling de estado o notificación por email al completar
- Se necesita caché de reportes por periodo

En ese caso, crear `PayrollReportJob` en `apps/api/src/reports/worker/report.worker.ts`
usando el patrón existente de `alarm-notification.worker.ts` (raw BullMQ, sin `@Processor`).

Esta bifurcación queda documentada pero NO implementada en Task 03 MVP.

---

## Criterios de aceptación

- [ ] `GET /api/reports/payroll/export?format=xlsx&year=2026&month=6` retorna buffer .xlsx descargable
- [ ] `GET /api/reports/payroll/export?format=pdf&year=2026&month=6` retorna buffer .pdf descargable
- [ ] Headers `Content-Disposition` y `Content-Type` correctos en ambos formatos
- [ ] Excel: columnas con nombre correcto, fila de totales al final
- [ ] PDF: cabecera con empresa y periodo, tabla con empleados, totales al pie
- [ ] `format` inválido retorna 400
- [ ] Tests de `ReportExcelService` y `ReportPdfService` con datos mock (no requieren HTTP)
- [ ] Sin dependencias nuevas en producción más allá de `exceljs` (y solo si fue aprobado)

---

## Validaciones a ejecutar

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm exec jest --testPathPattern="report-excel|report-pdf" --no-coverage
```

---

## Riesgos y gaps

| Gap                                                              | Impacto                                                                 | Decisión                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `exceljs` no está instalado                                      | Excel bloqueado sin aprobación explícita                                | Solicitar aprobación antes de empezar Task 03    |
| pdfkit genera PDF con posicionamiento manual (sin layout engine) | Tablas largas requieren manejar paginación manualmente                  | Aceptable para MVP; cuidar el loop de paginación |
| Sin storage: si el PDF tarda >30s el request timeout             | Riesgo real solo si hay >500 empleados                                  | Documentar límite en README del endpoint         |
| Formato PILA no está estandarizado en el código                  | La columna PILA puede no coincidir con el operador usado por el cliente | Verificar con cliente antes de implementar       |
| Sin caché: mismo reporte se recalcula en cada request            | Aceptable en MVP                                                        | BullMQ + Redis cache en follow-up                |
