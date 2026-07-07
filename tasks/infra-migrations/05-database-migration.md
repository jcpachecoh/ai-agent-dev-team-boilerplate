# Task: Migración de base de datos Railway → OCI DB System

**Domain:** `[INFRA]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`, `04-oci-vault-secrets`  
**SDD Ref:** §6 Migración de Base de Datos

---

## Context

Migrar PostgreSQL desde Railway al OCI DB System provisionado en tarea 01.
El dump se hace desde la VM OCI (que tiene acceso a ambas redes), se restaura en el
DB System privado, y se valida que los row counts coincidan antes del cutover.

Railway mantiene su DB activa durante las 48h de parallel run como respaldo.

---

## Requirements

### Preparación

- [ ] Instalar `postgresql-client-14` en la VM (`apt install postgresql-client-14`)
- [ ] Verificar conectividad desde VM → Railway DB (host, port, credenciales)
- [ ] Verificar conectividad desde VM → OCI DB System IP privada (port 5432)
- [ ] Crear base de datos `palos_db` en OCI DB System si no existe
- [ ] Anotar row counts actuales en Railway como baseline de validación:
  ```sql
  SELECT schemaname, tablename, n_live_tup
  FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
  ```

### Dump desde Railway

- [ ] Ejecutar `pg_dump` con formato custom (comprimido):
  ```bash
  pg_dump \
    --host=<railway-host> \
    --port=<railway-port> \
    --username=postgres \
    --dbname=palos_db \
    --format=custom \
    --verbose \
    --file=palos_db_$(date +%Y%m%d_%H%M).dump
  ```
- [ ] Verificar que el archivo `.dump` tiene tamaño > 0 y no está corrupto (`pg_restore --list`)
- [ ] Guardar una copia en OCI Object Storage bucket `palos-assets/backups/`

### Restore en OCI DB System

- [ ] Ejecutar `pg_restore`:
  ```bash
  pg_restore \
    --host=<oci-db-private-ip> \
    --port=5432 \
    --username=admin \
    --dbname=palos_db \
    --format=custom \
    --verbose \
    palos_db_$(date +%Y%m%d_%H%M).dump
  ```
- [ ] Capturar y revisar warnings/errors del restore (secuencias, permisos — normales)

### Validación de integridad

- [ ] Comparar row counts entre Railway y OCI para cada tabla:
  ```sql
  SELECT count(*) FROM orders;
  SELECT count(*) FROM menu_items;
  SELECT count(*) FROM users;
  -- (resto de tablas principales)
  ```
- [ ] Diferencia permitida: 0 rows (dump y restore se hacen en ventana de mantenimiento)
- [ ] Ejecutar `VACUUM ANALYZE` en OCI DB post-restore
- [ ] Verificar que NestJS conecta a OCI DB con la URL del Vault (tarea 04)

### Runbook de rollback

- [ ] Documentar los pasos para revertir a Railway DB en caso de falla
- [ ] El `DATABASE_URL` en Railway no se elimina hasta 30 días post-cutover

---

## Acceptance Criteria

- [ ] Row counts en OCI DB coinciden 100% con Railway al momento del dump
- [ ] NestJS arranca y conecta exitosamente a OCI DB System
- [ ] Una query de prueba end-to-end desde la API retorna datos reales (ej: GET /api/orders)
- [ ] `pg_restore --list palos_db_*.dump` no muestra objetos faltantes

---

## Files to Create

- `infra/scripts/db-dump.sh` — script parametrizado para pg_dump desde Railway
- `infra/scripts/db-restore.sh` — script parametrizado para pg_restore en OCI
- `infra/scripts/db-validate.sh` — script que compara row counts entre ambas DBs
