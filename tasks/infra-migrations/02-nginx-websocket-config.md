# Task: Configurar Nginx con soporte WebSocket para KDS

**Domain:** `[INFRA]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`  
**SDD Ref:** §3 Nginx — Configuración crítica WebSocket

---

## Context

Nginx actúa como reverse proxy entre el OCI Load Balancer y NestJS. La configuración de
WebSocket es crítica para el KDS: sin los headers `Upgrade` y `Connection` correctos,
Socket.IO cae a long-polling y las conexiones del Raspberry Pi se cortan.

SSL se configura aquí con Let's Encrypt (certbot) para habilitar HTTPS desde día 1.

---

## Requirements

### Instalación

- [ ] Instalar Nginx 1.24 en la VM (`apt install nginx=1.24.*`)
- [ ] Instalar Certbot (`snap install --classic certbot`)
- [ ] Habilitar Nginx en systemd (`systemctl enable nginx`)

### Configuración de sitio

- [ ] Crear `/etc/nginx/sites-available/palos-de-lenos` con el contenido del SDD §3
- [ ] El bloque `map $http_upgrade $connection_upgrade` debe estar en el contexto `http`
  (moverlo a `/etc/nginx/conf.d/websocket-map.conf` si Nginx lo requiere)
- [ ] `location /socket.io/` con los headers de WebSocket upgrade:
  - `proxy_http_version 1.1`
  - `proxy_set_header Upgrade $http_upgrade`
  - `proxy_set_header Connection $connection_upgrade`
  - `proxy_read_timeout 3600s`
  - `proxy_send_timeout 3600s`
- [ ] `location /api/` como reverse proxy simple a `localhost:3000`
- [ ] Symlink en `sites-enabled/` y deshabilitar el `default`

### SSL / HTTPS

- [ ] Reducir TTL del DNS a 60s antes de apuntar el dominio
- [ ] Obtener certificado Let's Encrypt para `api.palosdeleños.com`
- [ ] Certbot auto-renew configurado (cronjob o systemd timer)
- [ ] Redirect HTTP → HTTPS automático en el bloque server port 80

### Sticky sessions para PM2 cluster

- [ ] Configurar `ip_hash` en el upstream de Nginx para sticky sessions
  (evita que Socket.IO cambie de worker entre peticiones mientras no haya Redis adapter)

### Validación

- [ ] `nginx -t` sin errores
- [ ] `systemctl reload nginx` aplicado sin errores

---

## Acceptance Criteria

- [ ] `curl https://api.palosdeleños.com/api/health` retorna HTTP 200
- [ ] WebSocket handshake exitoso: `wscat -c wss://api.palosdeleños.com/socket.io/?EIO=4&transport=websocket`
- [ ] Conexión Socket.IO desde Raspberry Pi establecida y estable > 5 minutos
- [ ] `certbot renew --dry-run` exitoso
- [ ] HTTP redirige a HTTPS (301)

---

## Files to Create

- `/etc/nginx/sites-available/palos-de-lenos` (en la VM — documentar como template en repo)
- `/etc/nginx/conf.d/websocket-map.conf` (en la VM)
- `infra/nginx/palos-de-lenos.conf` (copia en repo para versionado)
