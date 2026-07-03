# Task 02 — REST Report Endpoints

## Objetivo

Exponer los cálculos de Task 01 como endpoints REST autenticados con JWT.
Filtros por tenant/location/employee/period. Respuesta JSON. Sin exports todavía.

Prerequisito: Task 01 completada y sus tests pasando.

---

## Contexto del análisis previo

### Endpoints existentes reutilizables

| Módulo                                 | Patrón                                 | Reusar                                |
| -------------------------------------- | -------------------------------------- | ------------------------------------- |
| `payroll.controller.ts`                | JWT guard, x-tenant-id header          | Mismo patrón para reportes            |
| `attendance.controller.ts`             | JWT guard, filtros por locationId/date | Mismos filtros para attendance report |
| `PayrollService.findAll`               | Listado de empleados por tenant        | Fuente de empleados para calcular     |
| `AttendanceService.getOvertimeSummary` | Resumen OT por empleado y fecha        | Ampliar para rango mensual            |

### Módulo de reports: no existe

No existe `reports/`, `payroll-report/` ni ningún controller con `/reports` en el proyecto.
Se creará dentro de `apps/api/src/payroll/` para mantener cohesión del dominio de nómina.

### Autenticación

- Todos los endpoints requieren JWT (`Authorization: Bearer <token>`)
- El `tenantId` se extrae del token (patrón existente: `@Tenant() tenantId`)
- `locationId` y `employeeId` son query params opcionales
- `year` y `month` son query params obligatorios

---

## Scope

### Endpoints a implementar

| Método | Ruta                                  | Descripción                                                |
| ------ | ------------------------------------- | ---------------------------------------------------------- |
| `GET`  | `/api/reports/payroll`                | Nómina mensual del tenant (todos los empleados o filtrado) |
| `GET`  | `/api/reports/payroll/:employeeId`    | Nómina de un empleado específico en el periodo             |
| `GET`  | `/api/reports/attendance`             | Resumen de asistencia mensual del tenant                   |
| `GET`  | `/api/reports/attendance/:employeeId` | Asistencia de un empleado específico                       |
| `GET`  | `/api/reports/social-security`        | Consolidado de aportes patronales (PILA) del periodo       |

### Archivos a crear

```
apps/api/src/reports/
  reports.module.ts
  controller/
    reports.controller.ts
    dto/
      report-query.dto.ts                 ← filtros comunes
      payroll-report-response.dto.ts      ← mapeado desde EmployeePayrollPeriod
      attendance-report-response.dto.ts   ← mapeado desde AttendanceMonthSummary
      social-security-report-response.dto.ts
  service/
    reports.service.ts                    ← orquesta PayrollCalculationService + consultas BD
  repository/
    reports.repository.ts                 ← queries Prisma para datos base del reporte
  test/
    reports.controller.spec.ts
    reports.service.spec.ts
```

### Archivos a modificar

```
apps/api/src/app.module.ts              ← importar ReportsModule
```

### Archivos prohibidos

- `schema.prisma` — sin cambios de schema en Task 02
- `apps/api/prisma/migrations/`
- `apps/web-app/`
- `package.json` / lockfiles
- `payroll/service/payroll.service.ts` — no modificar servicio existente

---

## DTOs

### `ReportQueryDto` (query params compartidos)

```typescript
class ReportQueryDto {
  @IsInt()
  @Min(2020)
  @Max(2030)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
```

### `PayrollReportResponseDto`

Mapea `EmployeePayrollPeriod` de Task 01 a respuesta API. Incluir:

- Datos del empleado (nombre, cédula, cargo, contrato)
- Devengos, deducciones, neto
- Aportes patronales
- `overtimeBreakdown` como array

### `SocialSecurityReportResponseDto`

Un registro por empleado:

- `employeeId`, `employeeName`, `cedula`
- `salaryBase`, `healthBase`, `pensionBase`
- `employerHealthContribution`, `employerPensionContribution`, `employerArlContribution`
- `employerSenaContribution`, `employerIcbfContribution`, `employerCajaContribution`
- `totalEmployerContributions`

---

## Lógica del `ReportsService`

```typescript
// Obtiene todos los AttendanceLogs del mes para el tenant/location
// Construye AttendanceMonthSummary por empleado
// Llama PayrollCalculationService.calculateEmployeePeriod para cada uno
// Retorna array ordenado por apellido/nombre
getPayrollReport(tenantId, query: ReportQueryDto): Promise<EmployeePayrollPeriod[]>

// Mismo flujo pero para un solo empleado
getEmployeePayrollReport(tenantId, employeeId, query): Promise<EmployeePayrollPeriod>

// Agrega attendance logs por empleado sin aplicar cálculos monetarios
getAttendanceReport(tenantId, query): Promise<AttendanceMonthSummary[]>

// Extrae solo aportes patronales de getPayrollReport
getSocialSecurityReport(tenantId, query): Promise<SocialSecurityReportItem[]>
```

---

## `ReportsRepository` — queries Prisma necesarias

```typescript
// Todos los EmployeeDetails del tenant (con User para nombre/cédula)
findEmployeesByTenant(tenantId, locationId?): Promise<EmployeeWithUser[]>

// AttendanceLogs de un rango fecha/tenant/employee
findAttendanceByPeriod(tenantId, year, month, employeeId?): Promise<AttendanceLog[]>
// WHERE workDate >= startOfMonth AND workDate <= endOfMonth
// Include: employee (para join), location
```

---

## Criterios de aceptación

- [ ] `GET /api/reports/payroll?year=2026&month=6` retorna array con todos los empleados activos del tenant
- [ ] Filtro `locationId` restringe resultado a esa sede
- [ ] Filtro `employeeId` retorna exactamente un registro
- [ ] `year`/`month` inválidos retornan 400 con mensaje claro
- [ ] Empleado sin logs de asistencia en el periodo retorna `workedDays = 0`, `netPay = 0` (no 500)
- [ ] `GET /api/reports/social-security` suma correctamente `totalEmployerContributions` por tenant
- [ ] Todos los endpoints protegidos: sin JWT retorna 401
- [ ] Tenant isolation: usuario de tenant A no puede ver datos del tenant B
- [ ] Tests de controller y service con mocks de `PayrollCalculationService`

---

## Validaciones a ejecutar

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm exec jest --testPathPattern="reports" --no-coverage
```

---

## Riesgos y gaps

| Gap                                                                                   | Impacto                                                                                        | Destino                        |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------ |
| `ReportsService.getPayrollReport` puede ser lento sin paginación (N+1 por empleado)   | Aceptable en MVP para tenants pequeños (<50 empleados). Documentar límite.                     | Follow-up                      |
| Nombres de empleados no están en `EmployeeDetails`, están en `User` (falta en schema) | `User` no tiene nombre (solo email + cédula). Solución: usar email o agregar campo. Verificar. | Verificar antes de implementar |
| `User.firstName`/`lastName` pueden no existir                                         | Revisar si el schema de User tiene nombre; si no, el response usará email como identificador   | —                              |
| Periodo con festivos reportará overtime clasificado como DIURNO incorrectamente       | Aceptable en Task 02; documentar en response con `festiveAdjusted: false`                      | Task 04                        |
