# Task 01 — Backend: contratos de filtros y exportación

**Domain:** `[BACKEND]` `[REPORTS]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** —  
**Epic:** NOM-09

---

## Goal

Definir los **DTOs, interfaces y tipos** compartidos para filtros y exportación en el módulo de Nómina, alineados con las tres familias de vista (empleados, liquidación, asistencia).

---

## Scope

### DTOs nuevos / extendidos (`apps/api/src/reports/controller/dto/`)

**`employee-list-export-query.dto.ts`**

```typescript
// Campos propuestos
locationId?: string;
employeeId?: string;      // userId o employeeDetails.id — documentar cuál
positionId?: string;
area?: string;            // búsqueda parcial o exacta — documentar
department?: string;
contractType?: EmployeeContractType;
isActive?: boolean;       // true | false; omitido = todos
search?: string;          // nombre, cédula, email — server-side
format: ExportFormat;     // PDF | XLSX (reutilizar enum existente)
```

**`attendance-export-query.dto.ts`**

- Extiende `AttendanceQueryDto` (`from`, `to`, `locationId`).
- Añadir: `employeeId?`, `status?` (`PRESENT` | `ABSENT` | `LATE` | `ALL`).
- Añadir: `format: ExportFormat`.

**`payroll-settlement-export-query.dto.ts`**

- Alias o extensión de `ExportPayrollReportDto` + `PeriodQueryDto` existentes.
- Documentar campos ya soportados: `period`, `locationId`, `employeeId`, `contractType`.

### Interfaces (`apps/api/src/reports/interfaces/`)

- `ExportColumnDefinition` — `{ key, header, width? }`.
- `ExportMetadata` — `{ tenantName, generatedAt, filtersSummary: string[], rowCount }`.
- `IExportableReport<T>` — contrato para servicios PDF/Excel por tipo de reporte.

### Tipos de respuesta de consulta (sin archivo binario)

- Asegurar que `ReportsRepository` / `PayrollRepository` expongan métodos de listado **sin paginación** reutilizables por export, con los mismos `where` que la vista.

### Documentación inline

- Swagger `@ApiProperty` en todos los campos nuevos.
- Comentario: **`tenantId` nunca en body** — siempre del JWT.

---

## Out of scope

- Implementación de endpoints HTTP (task 02).
- Generación PDF/Excel (task 02).
- Cambios en Prisma schema.
- Frontend.

---

## Files allowed

- `apps/api/src/reports/controller/dto/**`
- `apps/api/src/reports/interfaces/**`
- `apps/api/src/reports/interfaces/reports.interfaces.ts`
- `apps/api/src/payroll/interfaces/**` (solo tipos de filtro si hace falta)

## Files forbidden

- `apps/api/src/app.module.ts`
- `schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- `apps/web-app/**`
- `packages/**`

---

## Acceptance criteria

- [ ] Existen DTOs validados con `class-validator` para las tres familias de export.
- [ ] `ExportFormat` reutilizado (no duplicar enum).
- [ ] Interfaces de columnas y metadata documentadas para PDF/Excel.
- [ ] Swagger describe cada filtro y el comportamiento multi-tenant.
- [ ] Sin lógica de generación de archivos en esta task (solo contratos).

---

## Validation commands

```bash
pnpm --filter api typecheck
pnpm --filter api lint
node scripts/validate-structure.js
```
