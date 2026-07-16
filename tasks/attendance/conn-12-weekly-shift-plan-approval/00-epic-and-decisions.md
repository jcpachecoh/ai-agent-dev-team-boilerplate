# CONN-12 — Aprobación semanal de malla de turnos, asignación same-day y corrección de marcación manual

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[ATTENDANCE]` `[TURNOS]` `[PAYROLL]`  
**Status:** `completed`  
**Created:** 2026-07-16  
**Jira:** `CONN-12` (crear/asignar issue; extiende `CONN-03` / `OS-604`; toca `OS-553` / `OS-554`)  
**Módulo NestJS:** `apps/api/src/turnos/` (extender) + consumidores en `attendance/` (CONN-11) y liquidación/nómina  
**UI:** grilla semanal OS-582, carga masiva OS-583, tarjeta de asistencia OS-551/OS-553  
**Depends on:** CONN-03 (OS-604 malla), OS-582, OS-583, CONN-11, CONN-06  
**Blocks / alimenta:** CONN-11 (corte automático), liquidación, CONN-06 (prorrateo por sede real)

---

## Contexto (flujo confirmado en reunión)

1. El **administrador de sede** arma la planeación semanal de turnos (debe quedar lista el **viernes** para la semana siguiente). La carga puede ser **manual** o **masiva vía Excel** (plantilla con los mismos campos).
2. El **gerente de operaciones** revisa y **aprueba** la planeación. **Solo la malla aprobada** es el insumo válido para el corte automático (CONN-11) y la liquidación.
3. **Asignación el mismo día:** por contingencias (incapacidad de última hora, rotantes enviados a otro punto), debe poderse asignar un turno **hoy para hoy**, y el colaborador debe poder **marcar en una sede distinta a la planificada**. La **marcación real prevalece** para el prorrateo (CONN-06).
4. **Defecto demo:** la marcación manual desde la web falla y debe corregirse (OS-553 / OS-554).

---

## Historia de usuario

**Como** administrador de sede y gerente de operaciones,  
**quiero** planear turnos semanales, aprobarlos formalmente y poder reaccionar el mismo día a contingencias,  
**para que** el corte automático y la liquidación solo usen malla válida, y la sede real de marcación alimente el prorrateo de rotantes.

---

## Relación con Jira / epics existentes

| Ticket / epic    | Relación                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| CONN-03 / OS-604 | **Extiende** el modelo de turnos: agrega ciclo de aprobación semanal sobre la malla ya definida   |
| OS-582           | Grilla semanal de asignación — base UI de planeación                                              |
| OS-583           | Carga masiva Excel — reutilizar plantilla/campos; el resultado entra al flujo de aprobación       |
| OS-553 / OS-554  | **Corregir** defecto de marcación manual web + soportar marcación con asignación same-day         |
| CONN-11          | Consumidor: solo turno/malla **aprobada** alimenta el corte automático                            |
| CONN-06          | Consumidor: marcación en sede distinta a la planificada → fuente `MARCACION_ASISTENCIA` prevalece |

---

## Objetivo

1. Introducir un **ciclo de aprobación semanal** sobre la planeación de turnos (draft → aprobado).
2. Mantener **carga masiva Excel** funcional con la plantilla existente (mismos campos que creación manual).
3. Permitir **asignación same-day** y marcación en sede distinta a la planificada, alimentando CONN-06.
4. **Corregir** la marcación manual desde la web (defecto demo).
5. Garantizar que **malla sin aprobar no alimenta** corte CONN-11 ni liquidación.

---

## ⭐ Puntos clave

### PC-1 — Solo malla aprobada es operativa

- Mientras la planeación esté en borrador / pendiente de aprobación, **no** es insumo válido para:
  - Corte automático CONN-11
  - Liquidación / cálculo de horas ordinarias basadas en turno planificado
- Tras aprobación del gerente de operaciones, esa malla pasa a ser la fuente operativa de la semana.

### PC-2 — Roles del flujo

| Actor                      | Acción                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Administrador de sede      | Arma / edita planeación semanal (manual o Excel) hasta el viernes |
| Gerente de operaciones     | Revisa y aprueba (o rechaza) la planeación                        |
| Sistema (CONN-11 / nómina) | Solo lee asignaciones de malla en estado aprobado                 |

> Roles concretos en RBAC (`MANAGER`, permiso nuevo, etc.) — cerrar en D1.

### PC-3 — Same-day y contingencias

- Debe ser posible crear/actualizar un `TurnoAssignment` (o equivalente) con `workDate = hoy`.
- El colaborador puede marcar en una **sede distinta** a la del turno planificado.
- Para CONN-06 (rotantes): la **marcación real** prevalece sobre el turno planificado en la resolución de sede diaria (alineado a prioridad de fuentes: tras `MANUAL` no overwrite; entre turno y marcación, la regla de producto de reunión: marcación real gana para prorrateo).

### PC-4 — Excel = mismos campos que manual

- Reutilizar OS-583: plantilla e import con los mismos campos que la creación manual en grilla.
- La importación masiva **no bypasea** el ciclo de aprobación: el resultado queda en el mismo estado draft/pendiente hasta aprobación (salvo misma-semana operativa ya aprobada + reglas de excepción same-day — ver D3).

### PC-5 — Defecto marcación manual web

- Reproducir y corregir el fallo de marcación manual desde la tarjeta/web (demo).
- Criterio: crear ENTRY/EXIT manual con motivo válido persiste y se refleja en la tarjeta sin error 4xx/5xx indebido.

---

## Estado actual (codebase)

| Área                     | Hoy                                               | Gap                                                              |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| `TurnoAssignment`        | ASSIGNED/REST por `(employeeId, workDate)`        | Sin estado de aprobación semanal / semántica draft vs approved   |
| OS-582 grilla            | Edición directa de asignaciones                   | No hay “enviar a aprobación” / “aprobar malla”                   |
| OS-583 Excel             | Template + import funcionando                     | No integrado con ciclo de aprobación                             |
| `ShiftResolutionService` | Resuelve turno del día sin filtrar por aprobación | CONN-11 y liquidación consumen cualquier asignación              |
| CONN-06                  | TURNO > MARCACION > MANUAL                        | Ajustar/confirmar prevalencia de marcación real en same-day sede |
| Marcación manual web     | OS-553 endpoints + modal                          | Defecto demo: falla al marcar desde web                          |

---

## Decisiones de diseño

### D1 — Modelo de aprobación: ¿plan semanal o flag por celda? ✅

**Decisión:** **Opción A** — entidad `WeeklyShiftPlan` por `(tenantId, locationId, weekStart)` con status `DRAFT | PENDING_APPROVAL | APPROVED | REJECTED`.

- Las celdas siguen siendo `TurnoAssignment` (OS-582/OS-583 sin cambio de modelo).
- Asociación **implícita**: `workDate ∈ [weekStart, weekStart+6]` + sede del turno/plan — **sin** FK en `turno_assignments`.
- Semana = **lunes–domingo**, alineada a OS-582 `getMondayOfWeek`.

### D2 — RBAC aprobación ✅

- **Submit / armar malla:** roles de `TURNO_ASSIGNMENTS_WRITE` (`SUPERVISOR`, `MANAGER`, OWNER/SUPER_ADMIN) + permiso `attendance.turnos.assignment.write`.
- **Approve / reject:** `MANAGER` + OWNER/SUPER_ADMIN (`WEEKLY_SHIFT_PLAN_APPROVE_ROLES`). SUPERVISOR no aprueba.
- Permiso dedicado `attendance.turnos.plan.approve` diferido (reutiliza write de asignación en task-02 para no tocar seed).

### D3 — Edición after-approve y same-day ✅

- Malla **APPROVED**: edición de la semana bloqueada salvo **same-day** (hoy, contingencia) — implementado en task-03/05.
- Same-day post-aprobación queda **operativo inmediato** (sin mini-aprobación): la celda se escribe y, si el plan sigue APPROVED, `resolveForDay` la consume.
- “Reabrir plan” (volver a DRAFT) queda como mejora UX futura (task-07 puede exponerla).

### D4 — Prevalencia marcación vs turno (CONN-06) ✅

- Colaborador puede marcar en sede ≠ planificada (sin rechazo por mismatch de sede vs turno).
- Prioridad CONN-06 actualizada: `MANUAL > MARCACION_ASISTENCIA > TURNO_ASIGNADO`.

### D5 — Defecto marcación manual — root cause en implementación ✅

- Task dedicada a reproducir (tarjeta web) y corregir; no inventar rediseño OS-553 completo.

---

## Criterios de aceptación (epic)

- [x] La planeación semanal **solo queda activa** tras la aprobación del gerente de operaciones.
- [x] Carga masiva por Excel funcional con la plantilla definida (mismos campos que creación manual).
- [x] Se puede asignar un turno el **mismo día** y el colaborador puede marcar en una **sede distinta** a la planificada, alimentando CONN-06.
- [x] La marcación manual desde la web funciona correctamente (corrección del defecto de la demo).
- [x] Tests: turno same-day para rotante en otra sede; malla sin aprobar **no** alimenta liquidación / corte.

---

## Tasks

| #   | Archivo                                                                                                  | Entrega                                                     |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 01  | [task-01-schema-weekly-plan-approval.md](./task-01-schema-weekly-plan-approval.md)                       | Schema + migración estado de aprobación semanal             |
| 02  | [task-02-approval-service-api.md](./task-02-approval-service-api.md)                                     | Servicio + API submit/approve/reject + RBAC                 |
| 03  | [task-03-excel-and-grid-integration.md](./task-03-excel-and-grid-integration.md)                         | Grilla OS-582 + Excel OS-583 respetan ciclo de aprobación   |
| 04  | [task-04-consumers-conn11-liquidation.md](./task-04-consumers-conn11-liquidation.md)                     | ShiftResolution / CONN-11 / liquidación solo malla aprobada |
| 05  | [task-05-same-day-and-conn06-marking-prevalence.md](./task-05-same-day-and-conn06-marking-prevalence.md) | Same-day + sede distinta + CONN-06                          |
| 06  | [task-06-fix-manual-web-marking.md](./task-06-fix-manual-web-marking.md)                                 | Corregir defecto marcación manual web (demo)                |
| 07  | [task-07-frontend-approval-ux.md](./task-07-frontend-approval-ux.md)                                     | UX enviar/aprobar/rechazar + indicadores de estado          |
| 08  | [task-08-tests-validation.md](./task-08-tests-validation.md)                                             | Tests aceptación + Postman                                  |

```
OS-582/583 (grilla + Excel)
        │
        ▼
CONN-12 (draft → approve) ──► CONN-11 (corte) ──► liquidación
        │
        ├── same-day assignment
        └── marcación sede real ──► CONN-06 (prorrateo)
```

---

## Fuera de alcance

- App móvil nativa (solo contratos server-side / web).
- Rediseño completo de OS-553 (historial audit UI, motivos configurables por tenant).
- Notificaciones push/email de “plan pendiente de aprobación” (salvo que se agregue en task-02 como opcional mínimo).
- Cambios a plantilla Excel de campos distintos a los de creación manual.
- Integración contable NOM-18.

---

## Open questions

1. ~~¿Opción A (`WeeklyShiftPlan`) o B?~~ → **A** (cerrada en task-01).
2. ~~¿Same-day post-aprobación operativo inmediato?~~ → **Sí** (D3 / task-05).
3. ~~¿Semana = lunes–domingo o domingo–sábado?~~ → **lunes–domingo** (OS-582).
4. ¿Un plan por sede o uno multi-sede para el gerente de operaciones? → **por sede** (modelo A); el gerente aprueba por sede (puede iterar varias).
