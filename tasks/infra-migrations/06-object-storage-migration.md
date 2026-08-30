# Task: Migrar archivos a OCI Object Storage (S3-compatible)

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`, `04-oci-vault-secrets`  
**SDD Ref:** §7 OCI Object Storage — Migración desde Railway volumes

---

## Context

OCI Object Storage expone una API S3-compatible. El cambio en NestJS es mínimo:
solo se actualiza el endpoint y las credenciales en el `S3Client`. No se cambia la
lógica de negocio ni los nombres de bucket.

Los archivos existentes en Railway volumes (logos, audio cache ElevenLabs, exports)
deben copiarse al bucket `palos-assets` antes del cutover.

---

## Requirements

### Actualización del S3Client en NestJS

- [ ] Localizar todas las instancias de `S3Client` / `@aws-sdk/client-s3` en el código
- [ ] Cambiar el `endpoint` al formato OCI S3-compatible:
  `https://<namespace>.compat.objectstorage.sa-saopaulo-1.oraclecloud.com`
- [ ] Leer `OCI_ACCESS_KEY` y `OCI_SECRET_KEY` desde OCI Vault (via `OciVaultService` de tarea 04)
- [ ] `region` debe ser `sa-saopaulo-1` (región del bucket)
- [ ] Verificar que `forcePathStyle: true` está configurado (requerido por OCI)
- [ ] El cambio debe ser backward-compatible: en desarrollo local, usar MinIO o el endpoint original

### Migración de archivos existentes

- [ ] Inventariar archivos en Railway volumes:
  - Logos de restaurantes / tenants
  - Audio cache de ElevenLabs (si se persiste en disco)
  - Exports de reportes
- [ ] Usar `aws s3 cp` con el endpoint OCI para copiar cada directorio al bucket:
  ```bash
  aws s3 cp <railway-volume-path>/ \
    s3://palos-assets/<path>/ \
    --recursive \
    --endpoint-url https://<namespace>.compat.objectstorage.sa-saopaulo-1.oraclecloud.com
  ```
- [ ] Verificar conteo de objetos migrados vs objetos en Railway

### Estructura de prefijos en el bucket

- [ ] Definir y documentar la estructura de prefijos:
  - `logos/` — logos de restaurantes
  - `audio-cache/` — cache de ElevenLabs
  - `reports/` — exports de reportes
  - `backups/` — dumps de DB (tarea 05)

---

## Acceptance Criteria

- [ ] Upload de un archivo de prueba desde NestJS a `palos-assets` exitoso
- [ ] Download del mismo archivo retorna el contenido correcto
- [ ] Conteo de objetos migrados coincide con Railway volumes
- [ ] En desarrollo local, el código funciona sin cambios (usando variables de entorno locales)
- [ ] No hay credenciales OCI hardcodeadas en el código (`OCI_ACCESS_KEY` solo en Vault/env)

---

## Files to Create or Modify

- `apps/api/src/storage/storage.module.ts` — actualizar endpoint S3 según entorno
- `apps/api/src/storage/storage.service.ts` — usar credenciales desde `OciVaultService`
- `infra/scripts/migrate-storage.sh` — script para copiar archivos de Railway a OCI
