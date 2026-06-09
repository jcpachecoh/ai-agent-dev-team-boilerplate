# Task: Preparación Fase 2 — Dockerfile, Terraform y Redis adapter

**Domain:** `[INFRA]` `[BACKEND]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`  
**SDD Ref:** §9 Fase 2 — Preparación para OKE (Cuando escale)

---

## Context

Aunque la migración a OKE (Kubernetes) es Fase 2, hay tres cosas que deben hacerse
desde día 1 en Fase 1 para evitar reescribir en el futuro:

1. **Dockerfile multi-stage** — la imagen ya existe cuando se necesite para OKE
2. **Terraform** — toda la infra OCI está en código, no provisionada manualmente
3. **Redis adapter comentado** — el código está listo, solo descomentar en Fase 2

Esta tarea no activa ninguna de estas funcionalidades; solo las deja listas.

---

## Requirements

### Dockerfile multi-stage

- [ ] Crear `apps/api/Dockerfile` con dos stages según el SDD §9.2:
  - `builder`: Node 20 Alpine, instala deps y compila TypeScript
  - `production`: Node 20 Alpine, solo copia `dist/` y `node_modules/`
- [ ] Verificar que `docker build -t palos-api .` funciona localmente
- [ ] Verificar que `docker run -p 3000:3000 palos-api` arranca la app
- [ ] Agregar `.dockerignore` que excluya `node_modules`, `dist`, `.env`, `*.log`
- [ ] El Dockerfile debe construir la imagen de producción que PM2 puede reemplazar en Fase 2

### Redis adapter — código comentado

- [ ] Localizar o crear el módulo Socket.IO en NestJS (`src/socket/socket.module.ts`)
- [ ] Agregar el código comentado del Redis adapter según el SDD §9.1:
  ```typescript
  // TODO Fase 2: Descomentar cuando se migre a OKE
  // import { createAdapter } from '@socket.io/redis-adapter';
  // io.adapter(createAdapter(pubClient, subClient));
  ```
- [ ] Agregar `@socket.io/redis-adapter` como devDependency (no en prod aún)
- [ ] Dejar un comentario explicando por qué es necesario en Fase 2 (workers PM2 no comparten estado Socket.IO)

### Terraform — documentado como tarea de tarea 01

- [ ] Verificar que tarea 01 creó `infra/terraform/oci/` con todos los recursos
- [ ] Agregar `infra/terraform/oci/oke/` como directorio placeholder para Fase 2:
  - Crear `README.md` en ese directorio explicando que los módulos OKE van aquí
- [ ] Documentar en el README de `infra/terraform/` el plan de migración Fase 1 → Fase 2

---

## Acceptance Criteria

- [ ] `docker build -t palos-api apps/api` exitoso en la máquina local de desarrollo
- [ ] La imagen Docker resultante pesa < 500 MB
- [ ] El bloque de código Redis adapter está presente y comentado en `socket.module.ts`
- [ ] `infra/terraform/oci/oke/README.md` existe y describe qué irá ahí en Fase 2
- [ ] `pnpm tsc --noEmit` sigue pasando (ningún cambio rompe el tipo system)

---

## Files to Create or Modify

- `apps/api/Dockerfile`
- `apps/api/.dockerignore`
- `apps/api/src/socket/socket.module.ts` — agregar bloque Redis adapter comentado
- `infra/terraform/oci/oke/README.md`
- `infra/terraform/README.md`
