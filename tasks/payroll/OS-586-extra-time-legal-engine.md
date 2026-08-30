# OS-586 — Motor legal de horas extra y jornada semanal

**Domain:** `[BACKEND]` `[PAYROLL]` `[NOM-06]`
**Status:** `implemented (parcial — ver Fuera de alcance)`
**Rutas REST:** ninguna nueva — cambia el cálculo interno de `GET /reports/payroll`
**Depends on:** OS-585/NOM-06 (`LaborLegalParameter` + `LaborLegalParametersService.getValueAt/preload`)
**Bloquea a:** aprobación de horas extra queda pendiente de OS-605/OS-606 (CONN-04a/04b)

---

## Alcance

Auditoría previa a la implementación encontró que OS-585 dejó explícitamente fuera de su alcance los recargos de hora extra ordinaria (comentario en código: _"OS-585 scope is limited to RECARGO_DOMINICAL_FESTIVO"_) y que `JORNADA_MAX_SEMANAL`, aunque sembrado en NOM-06, no tenía ningún consumidor real en el motor de nómina. OS-586 cierra ambos gaps:

1. **Recargos de hora extra diurna/nocturna (25%/75%, CST art. 168) migrados a NOM-06** — nuevas keys `RECARGO_HORA_EXTRA_DIURNA` y `RECARGO_HORA_EXTRA_NOCTURNA`, sembradas como estables desde 2020-01-01. Antes vivían hardcodeadas en `payroll.constants.ts` (`OVERTIME_SURCHARGE`, eliminado) y duplicadas en `payroll-calculation.service.ts` (`BASE_OVERTIME_SURCHARGE`, eliminado).
2. **`JORNADA_MAX_SEMANAL` conectado como divisor de hora ordinaria** — `MONTHLY_HOURS_BASE` (240 fijo) se eliminó; el divisor ahora es `JORNADA_MAX_SEMANAL(fecha) × 5` (48h→240, 46h→230, 44h→220, 42h→210 desde jul-2026), resuelto por `LaborLegalParametersService.getValueAt`.
3. **Resolución de recargos y divisor por fecha de turno, no por último día del período** — antes `PayrollLegalRates` traía `recargoDominicalFestivo`/`recargoHoraExtraDiurna`/`recargoHoraExtraNocturna` como valores planos resueltos una sola vez al último día del período (`to`). Como `JORNADA_MAX_SEMANAL` corta el 15 de julio (no alineado a mes calendario), un período mensual puede contener dos vigencias distintas para el mismo tipo de recargo. Se refactorizó para resolver por la fecha real de cada día trabajado.
4. **`NOCTURNO_END_HOUR` eliminado** — código muerto confirmado (cero referencias); la clasificación de nocturnidad solo compara contra la hora de inicio (`HORARIO_NOCTURNO_INICIO`), nunca contra una de fin.

### Fuera de alcance (explícitamente)

- **Aprobación de horas extra**: el AC "horas extra sin aprobación no se liquidan" queda bloqueado — no existe ningún modelo de solicitud/aprobación en el schema (se verificó dos veces, incluyendo búsqueda de nombres alternativos). Depende de OS-605 (CONN-04a) y OS-606 (CONN-04b). No se creó ningún modelo ni flujo nuevo para esto; el motor queda preparado para consumir un estado de aprobación cuando exista (ver `GAP(OS-586)` en `AttendanceMonthSummary.overtimeEntries`).
- **`PayrollExtraTimeLegal` (tabla nueva)**: descartada. NOM-06 (`LaborLegalParameter`) ya es la fuente única de verdad; crear otra tabla habría duplicado la normativa.
- **Divisor con fórmula `horas_semana × 30/7`**: descartado explícitamente — cambiaba retroactivamente el valor hora de períodos ya liquidados sin necesidad. Se usó `horas_semana × 5` (equivalente a `(horas_semana/6) × 30`), que preserva el valor histórico (48h → 240) y solo cambia hacia adelante conforme baja la jornada legal.

---

## Decisiones

### `overtimeByType` (record por tipo) → `overtimeEntries` (lista de buckets con tasa resuelta)

`AttendanceMonthSummary.overtimeByType: Partial<Record<AttendanceOvertimeType, number>>` se reemplazó por `overtimeEntries: OvertimeMinutesEntry[]`, donde cada entrada trae su propio `monthlyHoursBase` y `surchargeRate` ya resueltos a la fecha del día trabajado. Si el mismo tipo (ej. `DIURNO`) tiene dos vigencias distintas dentro de un período, se generan dos entradas separadas en vez de mezclarlas con una tasa incorrecta. `PayrollCalculationService` dejó de conocer `MONTHLY_HOURS_BASE` y `legalRates.recargo*` — solo itera `overtimeEntries` y multiplica.

### `PayrollLegalRates` solo conserva valores realmente planos por período

`smlv`, `transportSubsidy` y `transportSubsidyThreshold` se mantienen resueltos una sola vez (al último día del período) porque SMLV y AUXILIO_TRANSPORTE tienen vigencias anuales que arrancan el 1 de enero — un corte que siempre coincide con el límite de un período mensual, así que no hay riesgo de mezclar dos vigencias dentro de un mismo mes. Los recargos y `JORNADA_MAX_SEMANAL` sí pueden cortar a mitad de mes (ej. 15 de julio, 25 de diciembre), por eso se resuelven por fecha de turno vía `OvertimeLegalRateResolvers` en vez de quedar en `PayrollLegalRates`.

### Test de integración del corte a mitad de período

Se agregó un test en `reports.service.spec.ts` que simula un corte de `JORNADA_MAX_SEMANAL` el 15 de junio (mismo patrón que el corte real del 15 de julio) dentro de un período de junio, y confirma que se generan dos entradas `DIURNO` con `hourlyRate` distinto. Sin el refactor de este ticket, el mecanismo anterior habría resuelto todo el período con la tasa vigente al último día, ocultando el corte.

---

## Backend

Todo el cambio vive en `apps/api/`, sin módulo nuevo ni migración de Prisma:

| Archivo                                                          | Cambio                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/labor-legal-parameters/labor-legal-parameters.constants.ts` | Nuevas keys `RECARGO_HORA_EXTRA_DIURNA`, `RECARGO_HORA_EXTRA_NOCTURNA`                                                                                                                                                             |
| `prisma/seeds/labor-legal-parameters.seed.ts`                    | Vigencias globales para ambas keys (estables desde 2020-01-01)                                                                                                                                                                     |
| `src/payroll/payroll.constants.ts`                               | `OVERTIME_SURCHARGE` y `MONTHLY_HOURS_BASE` eliminados (dead code tras la migración)                                                                                                                                               |
| `src/payroll/interfaces/payroll-report.interfaces.ts`            | `OvertimeMinutesEntry` (nuevo, `type` alias); `AttendanceMonthSummary.overtimeByType` → `overtimeEntries`; `PayrollLegalRates` pierde los 3 campos de recargo                                                                      |
| `src/payroll/service/payroll-calculation.service.ts`             | `BASE_OVERTIME_SURCHARGE` eliminado; itera `overtimeEntries` en vez de `overtimeByType`                                                                                                                                            |
| `src/reports/service/reports.service.ts`                         | `OvertimeLegalRateResolvers` (nuevo, `type` alias); `buildAttendanceSummary` resuelve recargos/divisor por fecha de cada día vía `addOvertimeMinutes`; preload agrega `RECARGO_HORA_EXTRA_DIURNA/NOCTURNA` y `JORNADA_MAX_SEMANAL` |
| `src/attendance/attendance.constants.ts`                         | `NOCTURNO_END_HOUR` eliminado (dead code)                                                                                                                                                                                          |

---

## Riesgos

- **Recargos de hora extra ahora versionados aunque son estables por ley**: decisión explícita para tener una única fuente de verdad vía `getValueAt(...)`, no porque se espere que cambien. Si nunca cambian, el costo es una lectura extra a NOM-06 por reporte, sin impacto funcional.
- **`GAP(OS-586)` en `overtimeByType`**: toda hora extra detectada se liquida hoy, sin importar si fue aprobada. Documentado en el código; no se debe cerrar OS-586 como "completo" en el AC de aprobación hasta que OS-605/OS-606 existan.

## Pendiente (bloqueado por otros tickets)

- Filtrar `overtimeEntries` por estado de aprobación una vez exista el modelo (OS-605/OS-606).

## Tests

- `payroll-calculation.service.spec.ts`: reescritos los 8 tests de `overtimePay` para el nuevo shape `overtimeEntries`; +1 test nuevo (`two vigencias of the same type in one period`).
- `reports.service.spec.ts`: +1 test de integración end-to-end del corte a mitad de período (`overtime surcharge/divisor resolve per work-day date, not per period last day`); fixture `LEGAL_PARAM_VALUES` extendido con las 3 keys nuevas.
- Suite completa (`apps/api`): 223 test suites, 2601 tests — sin regresiones.
- Lint: verificado con `git stash`/`pop` contra baseline — el branch queda con **menos** errores que `develop` (limpieza de un import duplicado preexistente expuesto al tocar `payroll-calculation.service.ts`), cero categorías nuevas de violación.

## Postman

Sin cambios — no se agregó ni modificó ningún endpoint. El efecto es visible en la respuesta de `GET /reports/payroll` (`overtimeBreakdown[].hourlyRate` y `.surchargeRate` ahora pueden variar dentro del mismo período si hay un corte de vigencia legal a mitad de mes).
