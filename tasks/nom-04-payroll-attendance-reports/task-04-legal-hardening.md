# Task 04 — Legal Hardening y Follow-ups

## Objetivo

Completar el cumplimiento legal del motor de nómina colombiana con las funcionalidades
que fueron deliberadamente excluidas de Tasks 01-03 por complejidad o riesgo de
implementación incorrecta. No iniciar hasta que Tasks 01-03 estén en producción y
validados con datos reales.

---

## Contexto

Tasks 01-03 producen liquidaciones correctas para el caso base:

- Contrato ORDINARIO/INTEGRAL
- Jornada regular diurna
- Sin festivos
- Sin retención en la fuente
- Sin fondo de solidaridad

Task 04 cubre los gaps legales identificados en la auditoría. Cada sub-tarea es
independiente y puede implementarse por separado.

---

## 4.1 — Calendario de Festivos Colombianos

### Por qué es un gap crítico

El enum `AttendanceOvertimeType` ya tiene `FESTIVO_DIURNO` y `FESTIVO_NOCTURNO` definidos
en el schema, pero `AttendanceService.calculateDaySummary` siempre devuelve `DIURNO`
o `NOCTURNO` porque no tiene acceso a un calendario.

Sin festivos:

- Trabajo en lunes festivo se liquida como extra DIURNA (25%) en lugar de FESTIVA (75%)
- El empleado recibe ~50% menos de recargo en esos días

### Implementación

#### Opción A — Festivos hardcodeados (recomendada para MVP legal)

```typescript
// apps/api/src/payroll/payroll.constants.ts
export const FESTIVOS_COLOMBIA: Record<number, string[]> = {
  2025: [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17',
    '2025-04-18', '2025-05-01', '2025-06-02', '2025-06-23',
    '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18',
    '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08',
    '2025-12-25',
  ],
  2026: [
    '2026-01-01', /* ... completar según Ley 51/1983 + cálculo emiliani ... */
  ],
};

export function isFestivo(date: Date, timezone = 'America/Bogota'): boolean { ... }
```

La Ley Emiliani (Ley 51/1983) mueve festivos que caen en martes-sábado al siguiente lunes.
La implementación debe contemplar este desplazamiento.

#### Opción B — Tabla en BD (para configuración dinámica)

Agregar modelo `Festivo` en schema:

```prisma
model Festivo {
  id       String   @id @default(cuid())
  date     DateTime @unique
  name     String
  year     Int
  @@index([year])
}
```

Con seed de festivos por año. Más flexible pero requiere migración.

**Decisión a tomar:** Opción A para arrancar (sin migración); Opción B si el cliente necesita
festivos regionales o departamentales.

### Archivos a modificar

```
apps/api/src/payroll/payroll.constants.ts          ← agregar FESTIVOS_COLOMBIA + isFestivo()
apps/api/src/attendance/service/attendance.service.ts  ← pasar isFestivo a calculateDaySummary
apps/api/src/payroll/service/payroll-calculation.service.ts  ← aplicar recargos festivos
```

---

## 4.2 — Retención en la Fuente (RENTA)

### Marco legal: Ley 2277/2022

La retención sobre salarios en Colombia (2025) usa rangos en UVT:

| Rango (UVT/mes) | Tarifa | Deducción fija (UVT) |
| --------------- | ------ | -------------------- |
| 0 – 95          | 0%     | 0                    |
| 95 – 150        | 19%    | 18.05                |
| 150 – 360       | 28%    | 32.05                |
| 360 – 640       | 33%    | 50.05                |
| 640 – 945       | 35%    | 62.05                |
| 945 – 2300      | 37%    | 80.95                |
| > 2300          | 39%    | 126.95               |

UVT 2025 = **49.799 COP** (verificar resolución DIAN actualizada).

### Implementación

```typescript
// apps/api/src/payroll/payroll.constants.ts
export const UVT_2025 = Number(process.env.UVT_AMOUNT) || 49799;

export function calcularRetencionFuente(
  ingresoBaseRetencion: number,  // salario - aportes obligatorios empleado - deducción 25% dependientes (si aplica)
  uvt: number,
): number { ... }
```

Complejidades a manejar:

- Deducción por dependientes (hasta 10% del ingreso, máximo 32 UVT/mes)
- `isExemptFromTax` en `EmployeeDetails` omite el cálculo (ya existe el campo)
- Salario integral: base = 70% del salario integral para retención
- PRESTACION/APRENDIZAJE: régimen diferente o exención

### Archivos a modificar

```
apps/api/src/payroll/payroll.constants.ts
apps/api/src/payroll/service/payroll-calculation.service.ts  ← agregar retencionFuente al cálculo
apps/api/src/payroll/interfaces/payroll-report.interfaces.ts  ← campo retencionFuente en EmployeePayrollPeriod
```

---

## 4.3 — Fondo de Solidaridad Pensional

Empleados con salario > 4 SMLV aportan un porcentaje adicional al fondo de solidaridad:

| Rango      | Aporte adicional |
| ---------- | ---------------- |
| 4–16 SMLV  | 1%               |
| 16–17 SMLV | 1.2%             |
| 17–18 SMLV | 1.4%             |
| 18–19 SMLV | 1.6%             |
| 19–20 SMLV | 1.8%             |
| > 20 SMLV  | 2%               |

Exentos: contratos APRENDIZAJE.

```typescript
// apps/api/src/payroll/payroll.constants.ts
export function calcularFondoSolidaridad(salarioBase: number, smlv: number): number { ... }
```

---

## 4.4 — Configuración Anual de SMLV/UVT/Auxilio

Problema actual: `SMLV_2025` está hardcodeado con fallback a env var. Si cambia en enero 2026,
requiere un deploy para actualizar.

### Opción A — Solo env vars

```
SMLV_AMOUNT=1423500
UVT_AMOUNT=49799
TRANSPORT_SUBSIDY_AMOUNT=162000
```

Simple, no requiere schema. Requiere actualizar env vars en producción en enero de cada año.

### Opción B — Tabla en BD `PayrollConfig`

```prisma
model PayrollConfig {
  id                    String   @id @default(cuid())
  tenantId              String?  // null = global
  year                  Int
  smlvAmount            Decimal
  uvtAmount             Decimal
  transportSubsidy      Decimal
  @@unique([tenantId, year])
}
```

Permite valores por tenant y por año. Requiere migración + seed.

**Decisión recomendada:** Opción A para 2025-2026. Opción B en 2027 si el producto crece.

---

## 4.5 — Límites Semanales y Mensuals de Overtime

Ley 2101/2021 establece 46h/semana como máximo en 2025 (reducción progresiva hasta 42h en 2026).
`MAX_WEEKLY_MINUTES` ya existe en `attendance.constants.ts` pero no se aplica en el cálculo
de `EmployeePayrollPeriod`.

Implementar:

- Acumulación semanal de horas para detectar infracción
- Overtime que exceda el límite semanal reportado como alerta (no bloqueo)
- `AttendanceMonthSummary.weeklyOvertimeAlerts: WeeklyOvertimeAlert[]`

---

## 4.6 — Contratos Especiales: PRESTACION y APRENDIZAJE

Actualmente `PayrollCalculationService` devuelve `totalEmployerContributions = 0` para estos
tipos (documentado en Task 01). Task 04 debe definir:

**PRESTACION:**

- No hay aportes patronales a salud/pensión/ARL por parte del empleante.
- El contratista aporta como independiente (responsabilidad del contratista).
- El sistema solo liquida el honorario neto.

**APRENDIZAJE:**

- Empresa aporta al SENA el 0% si el aprendiz cumple cuota (Ley 789/2002).
- Si hay incumplimiento de cuota, monetización: ~1 SMLV/mes al SENA.
- Este cálculo no es automatable sin datos de cuota de aprendices.

Implementar flag `requiresManualContribution: true` en el response para estos contratos,
con un mensaje explicativo en el DTO.

---

## Criterios de aceptación (por sub-tarea)

### 4.1 Festivos

- [ ] `isFestivo('2025-08-18')` retorna `true` (Asunción de la Virgen)
- [ ] Trabajo el 7 de agosto genera recargo `FESTIVO_DIURNO` (75%) en lugar de `DIURNO` (25%)
- [ ] Trabajo nocturno en festivo genera recargo `FESTIVO_NOCTURNO` (150%)
- [ ] Tests con al menos 5 festivos 2025 verificados

### 4.2 Retención

- [ ] Salario 3.000.000 COP → retención 0% (< 95 UVT)
- [ ] Salario 8.000.000 COP → retención calculada en rango 19-28%
- [ ] `isExemptFromTax = true` → retención = 0 siempre
- [ ] `retencionFuente` aparece en `EmployeePayrollPeriod` y en el export Excel/PDF

### 4.3 Fondo solidaridad

- [ ] Salario 3 SMLV → fondo = 0
- [ ] Salario 5 SMLV → fondo = 1% de base pensional

---

## Validaciones a ejecutar

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm exec jest --testPathPattern="festivos|retencion|solidaridad" --no-coverage
```

---

## Riesgos críticos

| Riesgo                                                                            | Severidad             | Mitigación                                                                                |
| --------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| UVT 2025 puede diferir de 49.799 COP (verificar resolución DIAN)                  | Alta (error legal)    | Siempre usar env var; nunca hardcodear en código fuente sin comentario de fuente          |
| Ley Emiliani: festivos calculados incorrectamente → pago de recargos insuficiente | Alta (pasivo laboral) | Verificar lista de festivos con fuente oficial (Ministerio del Trabajo) antes de deploy   |
| Retención para contratos INTEGRAL tiene base diferente                            | Media                 | Implementar rama separada en `calcularRetencionFuente` para `SalaryType.INTEGRAL`         |
| Deducción por dependientes requiere datos que no están en schema                  | Media                 | Implementar solo sin dependientes; agregar campo opcional en EmployeeDetails en follow-up |
| `MAX_WEEKLY_MINUTES` no coincide exactamente con Ley 2101 (reducción progresiva)  | Baja                  | Actualizar constante manualmente cada año; documentar con referencia legal                |

---

## Nota general para Task 04

**No implementar sin validación legal previa.** Los cálculos de retención y fondos de solidaridad
tienen implicaciones tributarias y laborales. Antes de poner en producción, validar con un
contador o asesor laboral colombiano que los valores sean correctos.

Documentar en el código cada fórmula con su fuente legal:

```typescript
// CST art. 168 — recargo horas extra diurnas: 25% del valor hora ordinaria
// Verificado contra: Código Sustantivo del Trabajo, art. 168 (Decreto 2663/1950)
```
