# ASIS-SSO — Login unificado del panel de asistencia con el User/JWT central de OpsSynk

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUTH]`
**Status:** `implemented` (backend scoping) | `pending` (OS-555 externo)
**Tickets Jira:** OS-547, OS-548, OS-550, OS-551 (panel de asistencia — admin) | OS-555 (app móvil del empleado, otro repo) | OS-314 (User/JWT central) | OS-554 (referencia de mapeo de roles)
**Depends on:** OS-314, OS-554, OS-555
**Recomendado implementar antes de:** continuar OS-547/OS-548/OS-550/OS-551

---

## Nota de alcance

- **OS-547** (panel de control, colaboradores, turnos, asistencias, reportes) es exclusivo del **administrador/supervisor** del sistema de asistencia (rol interno de gestión) — no el empleado de planta.
- **OS-555** es la app móvil del **empleado** (su propio registro biométrico, certificados, vacaciones). Es una superficie distinta, para el colaborador.
- **OS-555 vive en otro repositorio**, fuera de este monorepo. Ese repo usa hoy un **login de kiosko** (sesión de dispositivo/sede compartida, no login individual por empleado). Este task **no modifica ese repo** ni su flujo de kiosko — solo documenta el requisito de que, cuando se aborde OS-555, la validación de credenciales debe apuntar al mismo `User` central vía la API de OpsSynk.
- Ambas superficies deben validar contra el mismo `User`/JWT central (OS-314), sin una tabla de usuarios independiente para asistencia.

## Historia de usuario

Como administrador de sede, quiero acceder al panel de asistencia (OS-547) con el mismo usuario y contraseña que uso en el resto de OpsSynk, sin un login independiente.

---

## Decisiones tomadas

| Tema                                                  | Decisión                                                                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombres `RRHH_ADMIN` / `LOCATION_ADMIN` del enunciado | **Opción (a):** reusar roles existentes sin agregar códigos nuevos. `OWNER`/`SUPER_ADMIN` = admin general; `SUPERVISOR`/`MANAGER` = supervisión de sede (`LOCATION_SCOPED_ROLES` en `rbac.config.ts`). |
| Scoping por sede del supervisor                       | **Opción (b):** resolver contra `UserLocation` vía `UserLocationsService.resolveAllowedLocationIds` / `assertLocationAllowed`, reutilizable por attendance, payroll y reports.                         |
| OS-555 (otro repo)                                    | No se toca código aquí. Dependencia externa documentada.                                                                                                                                               |

---

## Implementación (backend)

| Componente              | Cambio                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `UserLocationsService`  | `resolveAllowedLocationIds` + `assertLocationAllowed` centralizados                               |
| `LOCATION_SCOPED_ROLES` | `SUPERVISOR`, `MANAGER` en `rbac.config.ts`                                                       |
| Attendance              | Scoping en monitor, panel, comparativo, historial, activos, tarjeta (lectura/escritura), overtime |
| Payroll / Reports       | Scoping en lecturas REST y GraphQL `employees`                                                    |
| Colaboradores / Turnos  | Ya tenían scoping propio; sin cambio de comportamiento                                            |
| Frontend                | Sin cambios — login general OpsSynk + `useAttendanceScopeLocations` ya existentes                 |

---

## Criterios de aceptación

- [x] Un usuario con rol `SUPERVISOR`/`MANAGER` entra al panel de asistencia (OS-547) viendo solo sus sedes asignadas en `UserLocation`, sin credenciales adicionales
- [x] No existe ninguna tabla de usuarios/contraseñas independiente para el panel de asistencia
- [ ] La app móvil del empleado (OS-555, otro repo) funciona con su propia UI de login, autenticando contra el User central — **pendiente, fuera de este repo**
- [x] El panel de asistencia (OS-547) no es accesible desde la app móvil del empleado ni viceversa — superficies distintas con permisos distintos sobre el mismo backend de auth

---

## Pendiente fuera de este repo

1. Issue/task para alinear login de kiosko OS-555 con JWT central de `apps/api`.
2. Actualizar tickets OS-547/548/550/551 en Jira indicando que no requieren login propio.

## Validation

```bash
pnpm --filter api test -- --testPathPattern="attendance|user-locations|payroll"
node scripts/validate-structure.js
```
