# Task: Cutover — Parallel run 48h y apagado Railway

**Domain:** `[INFRA]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `02-nginx-websocket-config`, `03-pm2-nestjs-cluster`, `04-oci-vault-secrets`, `05-database-migration`, `06-object-storage-migration`  
**SDD Ref:** §8 Checklist de Cutover (Parallel Run 48h)

---

## Context

Esta tarea es el go-live. Se ejecuta solo cuando todas las tareas anteriores están
completas y validadas. El orden es: pre-checks → DNS cutover → 48h parallel run →
apagado de Railway.

Railway permanece en standby durante las 48h como respaldo, sin recibir tráfico real.

---

## Requirements

### Pre-checks antes del cutover

- [ ] VM OCI respondiendo en < 200ms desde Colombia:
  ```bash
  curl -o /dev/null -s -w "%{time_total}" https://api.palosdeleños.com/api/health
  ```
- [ ] Socket.IO KDS probado con el Raspberry Pi físico del restaurante:
  - Conectar el Raspberry Pi al nuevo endpoint OCI
  - Enviar evento `ORDER_NEW` y verificar que llega al KDS
  - Verificar que el audio de ElevenLabs se reproduce sin cortes
- [ ] ElevenLabs TTS: test de audio continuo de 30 minutos sin interrupción
- [ ] Row counts de OCI DB coinciden con Railway (post-dump, ver tarea 05)
- [ ] Todos los secrets legibles desde NestJS vía OCI Vault (ver tarea 04)
- [ ] Nginx SSL activo y `certbot renew --dry-run` exitoso (ver tarea 02)
- [ ] OCI Load Balancer health check en estado verde

### DNS Cutover

- [ ] Reducir TTL de `api.palosdeleños.com` a 60s con al menos 24h de anticipación
- [ ] Verificar que el TTL bajo propagó globalmente (`dig api.palosdeleños.com`)
- [ ] Cambiar el registro A/CNAME de `api.palosdeleños.com` → IP del OCI Load Balancer
- [ ] Verificar propagación DNS desde múltiples regiones (usar `dnschecker.org` o similar)

### Monitoreo durante las 48h

- [ ] Monitorear logs PM2 en tiempo real: `pm2 logs palos-api`
- [ ] Verificar que no hay errores 5xx en Nginx: `tail -f /var/log/nginx/error.log`
- [ ] Verificar que las conexiones Socket.IO del KDS se mantienen estables
- [ ] Verificar que el costo OCI no supera el estimado (consola OCI Cost Management)
- [ ] Railway permanece encendido pero sin recibir tráfico nuevo

### Apagado de Railway (post 48h)

- [ ] Confirmar que las 48h transcurrieron sin incidentes
- [ ] Apagar los servicios Railway (no eliminar aún — mantener 30 días por el DB backup)
- [ ] Cancelar el plan Railway (si aplica — verificar fecha de facturación)
- [ ] Confirmar costo OCI del mes en curso < $25 USD

---

## Rollback Plan

Si durante las 48h se detecta un problema crítico:

1. Revertir el DNS a la IP de Railway (propagación en ~60s por el TTL bajo)
2. Railway sigue encendido con la DB activa — el tráfico vuelve inmediatamente
3. Investigar el problema en OCI sin presión de tiempo
4. Reprogramar cutover

---

## Acceptance Criteria

- [ ] 48h completas sin errores 5xx en producción OCI
- [ ] Socket.IO KDS estable durante las 48h (sin reconexiones forzadas)
- [ ] Servicios Railway apagados al finalizar las 48h
- [ ] Costo OCI del primer mes completo < $25 USD
- [ ] `api.palosdeleños.com` resuelve a OCI Load Balancer IP

---

## Files to Create

- `infra/runbooks/cutover.md` — runbook paso a paso para el día del cutover
- `infra/runbooks/rollback.md` — procedimiento de rollback a Railway
