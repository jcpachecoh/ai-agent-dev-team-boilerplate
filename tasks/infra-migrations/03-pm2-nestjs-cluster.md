# Task: Configurar PM2 en cluster mode para NestJS

**Domain:** `[INFRA]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`  
**SDD Ref:** §4 PM2 Ecosystem — NestJS cluster

---

## Context

NestJS corre en la VM bajo PM2 en cluster mode con 4 workers (1 por OCPU del ARM A1).
PM2 gestiona reinicios automáticos, logs y el arranque al boot de la VM.

**Nota importante:** Con 4 workers de PM2, las sesiones Socket.IO no se comparten entre
procesos. En Fase 1 esto se mitiga con sticky sessions en Nginx (tarea 02). En Fase 2
se agrega el Redis adapter para pub/sub entre workers.

---

## Requirements

### Instalación en VM

- [ ] Instalar Node.js 20 LTS vía nvm o NodeSource
- [ ] Instalar PM2 globalmente (`npm install -g pm2`)
- [ ] Configurar PM2 para arrancar al boot (`pm2 startup systemd`)

### Build de NestJS

- [ ] Clonar el repositorio en la VM (o configurar pipeline de deploy)
- [ ] `npm ci --production=false` para instalar dependencias incluyendo devDependencies de build
- [ ] `npm run build` genera `dist/`
- [ ] Verificar que `dist/main.js` existe antes de iniciar PM2

### ecosystem.config.js

- [ ] Crear `ecosystem.config.js` en la raíz del proyecto NestJS con:
  - `name: 'palos-api'`
  - `instances: 4`
  - `exec_mode: 'cluster'`
  - `max_memory_restart: '4G'`
  - `NODE_ENV: 'production'`
  - `PORT: 3000`
- [ ] Las variables de entorno secretas NO deben estar en el archivo (se leen desde OCI Vault en runtime)

### Gestión de procesos

- [ ] `pm2 start ecosystem.config.js` inicia los 4 workers
- [ ] `pm2 save` persiste la configuración
- [ ] `pm2 logs palos-api` muestra logs en tiempo real
- [ ] `pm2 reload palos-api` hace zero-downtime reload para deploys

### Zero-downtime deploy script

- [ ] Crear script `scripts/deploy-oci.sh` que:
  1. `git pull origin main`
  2. `npm ci`
  3. `npm run build`
  4. `pm2 reload palos-api`
- [ ] El script no reinicia la VM ni corta conexiones Socket.IO activas

---

## Acceptance Criteria

- [ ] `pm2 list` muestra 4 instancias `palos-api` en estado `online`
- [ ] `curl http://localhost:3000/api/health` retorna HTTP 200 desde la VM
- [ ] Al reiniciar la VM, PM2 arranca NestJS automáticamente (sin intervención manual)
- [ ] `pm2 reload palos-api` completa sin downtime (workers se reinician de a uno)
- [ ] Memoria de cada worker < 500 MB en estado idle

---

## Files to Create or Modify

- `ecosystem.config.js` (en el directorio de deploy de NestJS en la VM)
- `scripts/deploy-oci.sh` (en el repo, para versionado)
