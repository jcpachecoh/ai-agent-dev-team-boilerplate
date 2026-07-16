# Modo Marcación — Tablet compartida en sede

**Domain:** `[BACKEND]` `[GRAPHQL]` `[ATTENDANCE]` `[AUTH]` `[RBAC]`  
**Status:** `pending`  
**Created:** 2026-07-15  
**Jira:** _asignar_ (CONN-XX / OS-XXX)  
**Frontend:** **fuera de este repo** — otro repositorio consume las operaciones GraphQL documentadas aquí  
**Módulo NestJS:** extiende `apps/api/src/attendance/` + hooks en `auth/` y `turnos/`

---

## Problema

En la tablet compartida de la sede, cada empleado no debe iniciar/cerrar sesión con su usuario. El administrador/supervisor POS activa un **modo kiosko** que muestra solo empleados con turno asignado ese día; el empleado selecciona su nombre, captura foto y registra marcación sin login individual.

---

## Solución acordada (resumen)

| Área                   | Decisión                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| UI modo kiosko         | Bloqueada en selección de empleado + captura de foto (responsabilidad frontend)                        |
| Auth modo kiosko       | Token JWT de **alcance reducido** — no el token completo del administrador                             |
| Salida del modo        | Reautenticación del administrador (PIN o credenciales)                                                 |
| Lista de empleados     | Planeación semanal aprobada + asignaciones same-day (**CONN-12**)                                      |
| Verificación identidad | Match facial automático (cliente, mismo mecanismo OS-499/500/505); fallback PIN 4 dígitos del empleado |
| Intervención admin     | **Nunca** — no aprueba identidad manualmente                                                           |
| Trazabilidad           | Cada marcación etiquetada: `FACIAL_MATCH` \| `PIN`                                                     |
| Corrección pre-corte   | Supervisor anula/corrige con auditoría completa (**CONN-11** = corte automático de jornada)            |
| Corrección post-corte  | Flujo de novedad (**NOM-14**), no anulación directa                                                    |

---

## Estado actual del backend (gaps)

| Capacidad                               | Estado                            | Gap                                                                                     |
| --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `kioskAuth` (cédula+PIN → JWT completo) | Implementado (REST + GraphQL)     | Flujo **incorrecto** para tablet compartida — emite JWT de sesión completa del empleado |
| `registrarMarcacion` (app móvil)        | GraphQL, `source=APP_MOVIL`       | Requiere JWT del empleado; geo obligatoria; facial es metadata del cliente              |
| `POST /api/attendance/entry\|exit`      | REST público con `userId` en body | Sin auth, sin foto, sin verificación, `source=DEVICE` legacy                            |
| Lista empleados con turno hoy           | REST semanal OS-582               | No hay query “quién trabaja hoy en esta sede”; no expone GraphQL                        |
| Token scoped                            | No existe                         | `issueKioskAuthTokens()` emite JWT completo igual que login normal                      |
| `verificationMethod` en log             | No existe                         | Solo `facialMatchScore/Result` opcionales                                               |
| `AttendanceLogSource.KIOSK`             | No existe                         | `DEVICE` deprecado; producto final debe usar fuente explícita                           |
| Anulación auditada pre-corte            | Parcial                           | `manual-markings` REST crea corrección MANUAL; no distingue kiosko ni pre/post corte    |
| CONN-11 (corte automático)              | **No implementado**               | Prerequisito para regla pre/post corte                                                  |
| CONN-12 (same-day assignments)          | **No referenciado en código**     | Asumir extensión de `TurnoAssignment` o ticket hermano                                  |

---

## Operaciones GraphQL requeridas (contrato FE)

> El frontend en otro repo consume **solo GraphQL** para este flujo (salvo upload de foto si reutiliza endpoint REST de storage existente).

### Auth / modo kiosko

| Operación                         | Tipo     | Auth                              | Descripción                                         |
| --------------------------------- | -------- | --------------------------------- | --------------------------------------------------- |
| `activarModoMarcacionKiosko`      | Mutation | JWT admin/supervisor POS          | Emite token scoped + metadata de sesión kiosko      |
| `salirModoMarcacionKiosko`        | Mutation | Token kiosko + credenciales admin | Invalida sesión kiosko                              |
| `renovarTokenModoMarcacionKiosko` | Mutation | Token kiosko vigente              | Extiende TTL tras actividad (opcional si TTL corto) |

### Lista y datos del empleado

| Operación                      | Tipo  | Auth         | Descripción                                                    |
| ------------------------------ | ----- | ------------ | -------------------------------------------------------------- |
| `empleadosTurnoHoyKiosko`      | Query | Token kiosko | Empleados con turno en sede + estado marcación del día         |
| `fotoReferenciaEmpleadoKiosko` | Query | Token kiosko | URL firmada de foto de referencia para match facial en cliente |

### Marcación

| Operación                    | Tipo     | Auth         | Descripción                                                            |
| ---------------------------- | -------- | ------------ | ---------------------------------------------------------------------- |
| `registrarMarcacionKiosko`   | Mutation | Token kiosko | Registra ENTRY/EXIT con foto + verificación facial o PIN               |
| `verificarPinEmpleadoKiosko` | Mutation | Token kiosko | Valida PIN del empleado seleccionado (fallback); no emite JWT empleado |

### Corrección (supervisor — token admin normal, no kiosko)

| Operación                 | Tipo     | Auth                     | Descripción                                                                                 |
| ------------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `anularMarcacionKiosko`   | Mutation | JWT supervisor + permiso | Anula marcación kiosko del día antes de CONN-11 cutoff                                      |
| `corregirMarcacionKiosko` | Mutation | JWT supervisor + permiso | Crea log MANUAL enlazado; bloqueado post-corte → error con código `POST_CUTOFF_USE_NOVEDAD` |

---

## Decisiones de diseño (backend)

### D-1 — Token scoped `KIOSK_MARKING`

Claims JWT propuestos:

```typescript
{
  sub: adminUserId,           // quién activó el modo (auditoría)
  tenantId: string,
  locationId: string,         // sede fija de la sesión kiosko
  tokenType: 'KIOSK_MARKING', // discriminar en guards
  permissions: ['attendance.kiosk.mark'], // único permiso efectivo
  sessionId: string,          // para revocación
  exp: shortTTL,              // 15–30 min, renovable
}
```

**Prohibido** en token kiosko: `attendance.overtime.approve`, `attendance.mobile.read`, escritura de turnos, nómina, usuarios, etc.

Guard nuevo: `KioskMarkingGuard` — rechaza cualquier operación que no esté en allowlist explícita.

### D-2 — Fuente de marcación `KIOSK`

Nuevo valor en enum `AttendanceLogSource`:

```prisma
enum AttendanceLogSource {
  DEVICE    // @deprecated
  APP_MOVIL
  MANUAL
  KIOSK     // tablet compartida modo marcación
}
```

Marcaciones kiosko pasan por `AttendanceService.registerEvent()` (ASIS-UNI), no por `create()` legacy.

### D-3 — Método de verificación

Nuevo enum en schema:

```prisma
enum AttendanceVerificationMethod {
  FACIAL_MATCH
  PIN
  NONE   // solo si match facial deshabilitado por política/consentimiento
}
```

Campo en `AttendanceLog`: `verificationMethod AttendanceVerificationMethod?`

Reglas:

- Cliente envía `facialMatchScore` + `facialMatchResult` tras comparar localmente (mismo contrato que `RegistrarMarcacionInput`).
- Si score ≥ umbral configurado → registrar con `verificationMethod=FACIAL_MATCH`.
- Si score < umbral o sin foto de referencia → mutation acepta `pin` del empleado; backend valida `EmployeeDetails.pinHash` → `verificationMethod=PIN`.
- Admin **nunca** confirma identidad.

Umbral sugerido: reutilizar constante documentada en OS-499 (ej. 0.85) — configurable por tenant en fase 2.

### D-4 — Lista de empleados (CONN-12)

Query `empleadosTurnoHoyKiosko(locationId, workDate?)`:

1. Resolver `workDate` = hoy America/Bogota si omitido.
2. Incluir empleados con `TurnoAssignment` del día donde `type=ASSIGNED` y `turnoId IS NOT NULL`.
3. Incluir asignaciones same-day creadas/actualizadas el mismo día (**CONN-12** — si el ticket define campos adicionales, adaptar filtro).
4. Excluir `type=REST`.
5. Scope: `locationId` del token kiosko (no parametrizable a otra sede).
6. Retornar por empleado: `employeeId`, `fullName`, `turnoLabel`, `hasOpenEntry`, `lastEventType`, `hasPinConfigured`, `hasFacialReference`, `profilePhotoUrl?` (opcional inline o vía query separada).

Reutilizar: `ShiftResolutionService`, `TurnoAssignmentsRepository`.

### D-5 — Geofence en kiosko

Tablet fija en sede → **no** exigir geo del empleado. `validationStatus=VALID` por defecto en kiosko (sede ya acotada por `locationId` del token).

### D-6 — Consentimiento biométrico

Antes de intentar match facial, verificar `DataConsent` activo para `BIOMETRICO_FACIAL` del empleado. Si revocado → saltar facial, ir directo a PIN (`verificationMethod=PIN` obligatorio).

Reutilizar: `DataConsentService.hasActiveConsent()`.

### D-7 — Corrección y CONN-11

- **Pre-corte:** supervisor usa `anularMarcacionKiosko` / `corregirMarcacionKiosko`. Soft-invalidate (`isActive=false`) + `AuditLog` con motivo, valores original/nuevo, actor.
- **Post-corte:** service consulta `JornadaCutoffService.isBeforeCutoff(workDate, locationId)` (**CONN-11** — stub hasta que exista). Si post-corte → `ConflictException` con code `POST_CUTOFF_USE_NOVEDAD`; FE redirige a NOM-14.
- No borrado silencioso.

### D-8 — Timeout / sesión

Backend:

- TTL corto del token kiosko (configurable, default 20 min).
- Opcional: tabla `KioskMarkingSession` para revocación explícita al salir del modo.
- Cada `registrarMarcacionKiosko` exitosa puede emitir nuevo token con TTL reset (implementación FE o `renovarTokenModoMarcacionKiosko`).

Inactividad en UI es responsabilidad frontend; backend garantiza que token expirado → 401.

### D-9 — Deprecación flujo legacy

- `kioskAuth` + JWT empleado: mantener por compatibilidad NOM-03 pero **documentar deprecated** para tablet compartida.
- `POST entry/exit` públicos: no extender; nuevas marcaciones tablet → GraphQL kiosko.

---

## Dependencias

| Ticket                                                                | Relación                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ASIS-UNI                                                              | `registerEvent()` unificado — **requerido**                             |
| OS-582/583                                                            | `TurnoAssignment` semanal — **requerido** para lista                    |
| CONN-12                                                               | Same-day assignments — definir criterio exacto de inclusión             |
| [CONN-11](../conn-11-automatic-shift-cutoff/00-epic-and-decisions.md) | Corte automático jornada — **requerido** para regla pre/post corrección |
| OS-499/505                                                            | Match facial en cliente + metadata — **requerido**                      |
| OS-500                                                                | Consentimiento biométrico — **requerido**                               |
| NOM-14                                                                | Corrección post-corte — consumidor del error `POST_CUTOFF_USE_NOVEDAD`  |
| NOM-03                                                                | Kiosk legacy — convivencia temporal                                     |

---

## Tasks backend (orden sugerido)

| #   | Archivo                                                                                                        | Contenido                                                           |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | [task-01-schema-and-kiosk-session.md](./task-01-schema-and-kiosk-session.md)                                   | Schema: `KIOSK` source, `verificationMethod`, `KioskMarkingSession` |
| 2   | [task-02-scoped-kiosk-token-and-guards.md](./task-02-scoped-kiosk-token-and-guards.md)                         | Token scoped, guards, activar/salir modo                            |
| 3   | [task-03-graphql-employee-list-and-reference-photo.md](./task-03-graphql-employee-list-and-reference-photo.md) | Queries lista + foto referencia                                     |
| 4   | [task-04-graphql-kiosk-marking.md](./task-04-graphql-kiosk-marking.md)                                         | Mutation marcación + verificación PIN/facial                        |
| 5   | [task-05-kiosk-correction-and-audit.md](./task-05-kiosk-correction-and-audit.md)                               | Anulación/corrección pre-corte + integración CONN-11/NOM-14         |
| 6   | [task-06-tests-validation.md](./task-06-tests-validation.md)                                                   | Tests de aceptación backend                                         |

---

## Criterios de aceptación (épica — backend)

- [ ] Token kiosko rechazado en endpoints de aprobación/gestión (test explícito)
- [ ] `activarModoMarcacionKiosko` requiere rol/permiso admin POS
- [ ] `salirModoMarcacionKiosko` requiere reautenticación admin
- [ ] `empleadosTurnoHoyKiosko` refleja turnos semanales + same-day (CONN-12)
- [ ] `registrarMarcacionKiosko` con match facial exitoso → log `KIOSK` + `verificationMethod=FACIAL_MATCH`
- [ ] Match fallido + PIN correcto → log `KIOSK` + `verificationMethod=PIN`
- [ ] Admin no es prerrequisito en ningún path de verificación
- [ ] Anulación pre-corte auditada (actor, timestamp, original, motivo)
- [ ] Corrección post-corte retorna error estructurado para NOM-14
- [ ] Tests listados en task-06 pasan

---

## Fuera de alcance (este repo)

- UI modo kiosko, bloqueo navegación, timeout de inactividad en pantalla
- Modo kiosko real del SO (fullscreen / status bar)
- Motor de reconocimiento facial server-side (sigue siendo cliente)
- Implementación CONN-11 job de corte (solo consumo del contrato)
- Implementación CONN-12 si requiere schema nuevo no existente (coordinar ticket)
