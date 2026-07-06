# PROV-DOC Task 03 — Vigencias, alertas y validación obligatorios

**Domain:** `[BACKEND]` `[CRON]` `[EMAIL]` `[VALIDATION]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-supplier-documents-api.md](./task-02-backend-supplier-documents-api.md)

---

## Goal

Implementar cálculo de estados de vigencia (verde/amarillo/rojo), alertas de RUT (11 meses), vencimiento Cámara de Comercio (política tenant), notificaciones a 15 días y bloqueo de guardado de proveedor cuando faltan documentos obligatorios.

---

## Scope

- Servicio `SupplierDocumentExpirationService` (o método en service existente).
- Recalcular `SupplierDocument.status` en:
  - POST/PATCH documento
  - Job diario (BullMQ o `@Cron`)
- Reglas:
  - RUT: alerta si `lastUploadedAt` + `rutAnnualReviewMonths` < hoy
  - Cámara de Comercio: `expiresAt = issuedAt + camaraComercioValidityDays`
  - Umbrales UI: expirado / ≤ 15 días / vigente
  - Cámara de Comercio: alerta adicional visual < 7 días (flag en DTO `alertLevel`)
- Notificación AC 5: documentos con `expiresAt` en exactamente 15 días → in-app notification record + email opcional vía `@restopsiq/email`.
- Hook en `SupplierService.create` / `update`: validar documentos obligatorios según `Supplier.tipo` y flags → `400` con `requiredPending[]`.
- Tests unitarios de reglas y validación.

---

## Out of scope

- Frontend colores (Task 04 consume `status` / `alertLevel`).
- Push notifications móvil.
- Configuración UI de política 30/60/90 (API PATCH policy en task futura; usar default seed).

---

## Files allowed

- `apps/api/src/supplier-documents/**`
- `apps/api/src/supplier/service/supplier.service.ts`
- `apps/api/src/supplier/test/supplier.service.spec.ts`
- `apps/api/prisma/seed.ts` (solo si se agrega tabla de notificaciones in-app existente)

---

## Files forbidden

- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- Cambios de schema salvo hotfix bloqueante

---

## Matriz obligatoriedad (implementar en código)

| `documentType`                                     | Obligatorio cuando                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| RUT                                                | Siempre                                                                                         |
| CAMARA_COMERCIO                                    | `tipo === PERSONA_JURIDICA`                                                                     |
| CEDULA_REPRESENTANTE_LEGAL                         | Siempre                                                                                         |
| CERTIFICACION_BANCARIA                             | Siempre                                                                                         |
| LISTA_PRECIOS                                      | `sellsRecurrentProducts`                                                                        |
| CONTRATO_COMERCIAL                                 | `isCritical`                                                                                    |
| CERTIFICACION_SANITARIA, CONCEPTO_SANITARIO_INVIMA | `isFoodSupplier`                                                                                |
| HOJA_SEGURIDAD                                     | `handlesChemicals`                                                                              |
| FICHA_TECNICA_PRODUCTO                             | `isRawMaterialSupplier`                                                                         |
| TRATAMIENTO_DATOS_PERSONALES                       | Siempre                                                                                         |
| POLIZAS, CERTIFICADO_BPM, ACUERDO_CONFIDENCIALIDAD | No bloquean guardado (recomendados/condicionales por riesgo — solo warning en GET completeness) |

---

## Acceptance criteria

- [ ] RUT sin actualizar > 11 meses → status `EXPIRED` o flag `needsReview` documentado en DTO.
- [ ] Cámara de Comercio calcula `expiresAt` desde `issuedAt` + política tenant.
- [ ] Job envía notificación a 15 días del vencimiento (test con fecha mockeada).
- [ ] `updateSupplier` con obligatorios pendientes → 400 con mensaje claro y lista de tipos.
- [ ] Documentos ≤ 15 días → `EXPIRING`; vencidos → `EXPIRED`.
- [ ] Tests cubren casos PJ vs PN y flags condicionales.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="supplier-documents|supplier.service"
pnpm --filter=@restopsiq/api test:cov
```
