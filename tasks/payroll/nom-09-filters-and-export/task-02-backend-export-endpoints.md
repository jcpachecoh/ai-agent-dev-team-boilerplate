# Task 02 — Backend: endpoints de exportación PDF y Excel

**Domain:** `[BACKEND]` `[REPORTS]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** [task-01-backend-export-contracts.md](./task-01-backend-export-contracts.md)  
**Epic:** NOM-09

---

## Goal

Implementar endpoints de exportación que generen **PDF** y **XLSX** a partir de los **mismos filtros** que alimentan cada vista, reutilizando `ReportPdfService` y `ReportExcelService`.

---

## Scope

### Endpoints

| Método | Ruta                         | Descripción                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| `POST` | `/reports/employees/export`  | Listado de empleados filtrado → PDF / XLSX                        |
| `POST` | `/reports/attendance/export` | Reporte de asistencia por rango → PDF / XLSX                      |
| `POST` | `/reports/payroll/export`    | **Existente** — verificar que acepta todos los filtros de task 01 |

### Servicios

**`EmployeeListExportService`** (o métodos en `ReportsService`):

1. Resolver `tenantId` del actor JWT.
2. Ejecutar query con filtros del DTO (mismo `where` que listado API de empleados).
3. Aplicar límite `MAX_EXPORT_ROWS = 2000`; si se excede → `BadRequestException` con mensaje accionable.
4. Delegar a `ReportPdfService.generateEmployeeListPdf(data, metadata)` y `ReportExcelService.generateEmployeeListXlsx(...)`.

**`AttendanceExportService`:**

- Reutilizar `ReportsService.getAttendanceReport(filters)` para obtener filas.
- PDF: encabezado + resumen filtros + tabla (nombre, sede, minutos trabajados, HE, alerta legal).
- XLSX: mismas columnas.

### PDF — requisitos de formato

- Encabezado: nombre del restaurante/tenant (si disponible en contexto).
- Bloque **Filtros aplicados**: periodo/fechas, sede, empleado, estado.
- Tabla con columnas alineadas a la vista FE.
- Pie: fecha/hora de generación (`America/Bogota`).

### Excel — requisitos

- Hoja `Datos` con headers en fila 1.
- Sin filas ocultas con data extra no visible en pantalla.
- Formato numérico COP donde aplique.

### Multi-tenant

- Validar `locationId` y `employeeId` pertenecen al `tenantId` del JWT.
- Tests de aislamiento: tenant A no exporta datos de tenant B.

### Controller

- `Content-Type` y `Content-Disposition` correctos (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
- `@UseGuards(JwtAuthGuard)` + permiso nómina lectura.

---

## Out of scope

- Job async BullMQ para exports masivos (solo documentar hook si > 2000 filas).
- Logo binario en PDF (texto del tenant es suficiente en MVP).
- Frontend.

---

## Files allowed

- `apps/api/src/reports/controller/reports.controller.ts`
- `apps/api/src/reports/controller/dto/**`
- `apps/api/src/reports/service/reports.service.ts`
- `apps/api/src/reports/service/report-pdf.service.ts`
- `apps/api/src/reports/service/report-excel.service.ts`
- `apps/api/src/reports/repository/reports.repository.ts`
- `apps/api/src/reports/interfaces/**`
- `apps/api/src/reports/test/**`
- `apps/api/src/payroll/repository/**` (solo si hace falta query de empleados para export)

## Files forbidden

- `apps/api/src/app.module.ts`
- `schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- `apps/web-app/**`
- `packages/**`

---

## Acceptance criteria

- [ ] `POST /reports/employees/export` devuelve PDF válido (`%PDF`) y XLSX válido (`PK\x03\x04`).
- [ ] `POST /reports/attendance/export` devuelve PDF y XLSX con datos filtrados.
- [ ] Export de payroll existente sigue funcionando con filtros opcionales.
- [ ] Filtros en request = mismos resultados que query de listado (test de paridad).
- [ ] `tenantId` siempre del JWT; request con `employeeId` de otro tenant → `403` o `404`.
- [ ] Límite 2000 filas documentado y aplicado.
- [ ] Tests unitarios controller + servicios PDF/Excel para nuevos reportes.

---

## Validation commands

```bash
pnpm --filter api typecheck
pnpm --filter api test -- reports
node scripts/validate-structure.js
```

Manual (Postman):

```http
POST /api/reports/employees/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "PDF",
  "locationId": "<sede-id>",
  "isActive": true
}
```

Verificar headers de descarga y que el PDF lista solo empleados de la sede filtrada.
