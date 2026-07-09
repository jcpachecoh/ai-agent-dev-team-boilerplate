# NOM-13 Task 06 — Soporte médico (storage R2)

**Domain:** `[BACKEND]` `[STORAGE]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-medical-leave-service.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Permitir adjuntar el documento de incapacidad médica escaneado y obtener URL prefirmada de descarga.

---

## Scope

- Reutilizar patrón de `StorageObject` + servicio de storage existente (referencia: vacaciones carta PDF / foto empleado OS-562).
- Endpoint o método service:
  - `attachSupportDocument(tenantId, medicalLeaveId, file)` — upload a R2, guarda `supportStorageObjectId`.
  - `getSupportDocumentUrl(tenantId, medicalLeaveId)` — presigned GET.
- Tipos MIME permitidos: `application/pdf`, `image/jpeg`, `image/png`.
- Tamaño máximo: documentar límite (ej. 10 MB) alineado con otros uploads del repo.
- Tests con storage mock.

---

## Out of scope

- OCR del documento.
- Firma electrónica.

---

## Files allowed

- `apps/api/src/medical-leaves/service/**` — extend
- `apps/api/src/medical-leaves/controller/**` — solo si task 08 aún no existe; preferir coordinar con task 08
- `apps/api/src/medical-leaves/test/**`

---

## Files forbidden

- `prisma/schema.prisma` (salvo escalación)
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Registro sin adjunto permitido en MVP (opcional al crear) O obligatorio al radicar — **decisión: obligatorio antes de `RADICADA_EPS`**.
- [ ] URL prefirmada con expiración estándar del repo.
- [ ] Tenant isolation en storage key.

---

## Validation commands

```bash
pnpm --filter api test medical-leaves
```
