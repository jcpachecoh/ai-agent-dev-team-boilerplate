# Data consent — Ley 1581 (biométrico + geolocalización)

**Status:** `in_progress`  
**Tickets Jira:** OS-499, OS-500, OS-505, OS-555 (UI móvil — otro repo), OS-379  
**Depends on:** OS-379, OS-499, OS-500, OS-505

---

## Goal

Cumplir Ley 1581 de 2012 con consentimiento explícito, previo e informado para datos biométricos faciales y geolocalización en marcación móvil; política versionada; revocación con método alterno (PIN).

---

## Decisiones

| #   | Decisión                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `employeeId` en `DataConsent` referencia `EmployeeDetails.id` (no `User.id`).                                                                                          |
| D2  | Política versionada por tenant (`DataProcessingPolicy`); SuperAdmin publica nuevas versiones.                                                                          |
| D3  | Consentimiento granular por `ConsentType` (`BIOMETRICO_FACIAL`, `GEOLOCALIZACION`); la app móvil puede otorgar ambos en una sola mutación.                             |
| D4  | Sin consentimiento vigente → bloqueo de primer registro facial y marcación con geo/facial; respuesta indica `alternateMethodAvailable` si el empleado tiene `pinHash`. |
| D5  | UI de primer login (checkbox no premarcado) vive en **repo OS-555**; este monorepo expone **GraphQL** + pestaña en perfil web.                                         |
| D6  | Texto legal del borrador requiere validación de abogado antes de producción; seed usa marcador `[BORRADOR — PENDIENTE REVISIÓN LEGAL]`.                                |
| D7  | Auditoría en `AuditLog` (`entityType=DataConsent`, `CREATE` al otorgar, `UPDATE` al revocar).                                                                          |

---

## GraphQL (contrato para app móvil)

Ver [task-05-graphql-resolver.md](./task-05-graphql-resolver.md).

---

## Tasks

1. [task-01-schema-migration.md](./task-01-schema-migration.md)
2. [task-02-interfaces.md](./task-02-interfaces.md)
3. [task-03-repository.md](./task-03-repository.md)
4. [task-04-service.md](./task-04-service.md)
5. [task-05-graphql-resolver.md](./task-05-graphql-resolver.md)
6. [task-06-mobile-enforcement.md](./task-06-mobile-enforcement.md)
7. [task-07-frontend-profile-tab.md](./task-07-frontend-profile-tab.md)
8. [task-08-tests-validation.md](./task-08-tests-validation.md)
