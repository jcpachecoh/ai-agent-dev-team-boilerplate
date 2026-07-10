# NOM-14 Task 06 — Soporte digitalizado (storage R2)

**Domain:** `[BACKEND]` `[STORAGE]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-novedades-service.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Permitir adjuntar, vincular y descargar el soporte digitalizado de una novedad vía `StorageObject` (R2), reutilizando el patrón de NOM-13 task 06.

---

## Scope

### Comportamiento

- Upload presigned o endpoint multipart existente del módulo storage.
- Vincular `supportStorageObjectId` al crear/actualizar novedad.
- Endpoint de descarga: presigned URL con validación `tenantId`.
- Tipos MIME permitidos: PDF, JPEG, PNG (mismos límites que incapacidades).

### Archivos probables

- `apps/api/src/payroll-novedades/service/payroll-novedad-document.service.ts` (o método en service principal)
- Integración con `StorageModule` existente

### API (expuesto en task 09)

- `POST /payroll-novedades/:id/support` — subir/vincular
- `GET /payroll-novedades/:id/support/download` — presigned URL

---

## Out of scope

- UI upload (task 10).
- OCR o validación de contenido del documento.

---

## Files allowed

- `apps/api/src/payroll-novedades/**` — modify/create
- Tests en `apps/api/src/payroll-novedades/test/`

---

## Files forbidden

- `prisma/schema.prisma` (salvo ya hecho en task 01)
- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Soporte almacenado como `StorageObject`, no URL cruda.
- [ ] Descarga valida tenant y ownership del registro.
- [ ] Tests con storage mockeado.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll-novedad-document
node scripts/validate-structure.js
```
