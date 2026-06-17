# SDD: Migración Railway → OCI — Palos de Leños

**Versión:** 1.0.0  
**Fecha:** 2026-06-06  
**Equipo:** RestOPS  
**Fase:** 1 de 2 (VM ARM → OKE cuando escale)

---

## 1. Contexto y Objetivos

### Problema

Railway tiene costos crecientes y limitaciones de control de infraestructura. A medida que Palos de Leños escale a múltiples restaurantes, el costo se vuelve insostenible y la falta de configuración granular (especialmente para Socket.IO con WebSockets persistentes) es un riesgo.

### Solución

Migrar a OCI usando el **Free Tier permanente** de VM ARM Ampere A1 para el backend y OCI DB System para PostgreSQL, reduciendo el costo mensual de ~$50 USD (Railway) a ~$15-20 USD/mes.

### Objetivos

- Costo mensual < $25 USD
- NestJS responde < 200ms desde Colombia
- Socket.IO KDS funciona end-to-end con Raspberry Pi físico
- Voz ElevenLabs sin cortes
- Railway apagado tras 48h de parallel run exitoso

---

## 2. Arquitectura Fase 1 (VM ARM)

```
Internet
    │
    ▼
OCI Load Balancer (flexible shape, 10 Mbps — Free Tier)
    │
    ▼
VM ARM Ampere A1 ── Free Tier permanente
│  Shape: VM.Standard.A1.Flex
│  4 OCPUs / 24 GB RAM / Ubuntu 22.04
│
├── Nginx 1.24 (reverse proxy + WebSocket upgrade)
│   ├── /api/*        → NestJS :3000
│   ├── /socket.io/*  → NestJS :3000 (ws upgrade headers)
│   └── /             → Vercel (proxy pass o redirect)
│
└── NestJS (PM2 cluster mode, 4 workers)
    ├── REST API
    └── Socket.IO Gateway (KDS events: ORDER_NEW, ORDER_READY, ORDER_OVERTIME)
        └── ElevenLabs TTS audio → base64 → Socket.IO → Raspberry Pi

OCI DB System ─── PostgreSQL 14
│  Shape: VM.Standard.E4.Flex (1 OCPU / 16 GB)
│  Subnet privada (sin IP pública)
└── Backup automático: 7 días de retención

OCI Object Storage ─── Bucket: palos-assets
│  S3-compatible (mismo SDK, cambiar endpoint)
└── Logos, audio cache ElevenLabs, exports de reportes

OCI Vault ─── Secrets
├── DB_PASSWORD
├── ELEVENLABS_API_KEY
├── JWT_SECRET
└── NEXTAUTH_SECRET

OCI VCN ─── Virtual Cloud Network
├── Subnet pública: VM + Load Balancer
└── Subnet privada: DB System (sin acceso externo)
```

---

## 3. Nginx — Configuración crítica WebSocket

```nginx
# /etc/nginx/sites-available/palos-de-lenos
server {
    listen 80;
    server_name api.palosdeleños.com;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 4. PM2 Ecosystem — NestJS cluster

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'palos-api',
    script: 'dist/main.js',
    instances: 4,
    exec_mode: 'cluster',
    max_memory_restart: '4G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }]
};
```

---

## 5. Variables de entorno → OCI Vault

| Variable Railway     | OCI Vault Secret Name   | Tipo   |
|----------------------|-------------------------|--------|
| `DATABASE_URL`       | `palos-db-url`          | String |
| `ELEVENLABS_API_KEY` | `palos-elevenlabs-key`  | String |
| `JWT_SECRET`         | `palos-jwt-secret`      | String |
| `NEXTAUTH_SECRET`    | `palos-nextauth-secret` | String |
| `REDIS_URL`          | N/A en Fase 1           | —      |

---

## 6. Migración de Base de Datos

```bash
# Dump desde Railway
pg_dump \
  --host=<railway-host> \
  --port=<railway-port> \
  --username=postgres \
  --dbname=palos_db \
  --format=custom \
  --file=palos_db_$(date +%Y%m%d).dump

# Restore en OCI DB System
pg_restore \
  --host=<oci-db-private-ip> \
  --port=5432 \
  --username=admin \
  --dbname=palos_db \
  --format=custom \
  palos_db_$(date +%Y%m%d).dump

# Verificar integridad
psql -h <oci-db-private-ip> -U admin -d palos_db \
  -c "SELECT count(*) FROM orders; SELECT count(*) FROM menu_items;"
```

---

## 7. OCI Object Storage — Migración desde Railway volumes

```typescript
// Después (OCI Object Storage — mismo SDK, diferente endpoint)
const s3 = new S3Client({
  endpoint: 'https://<namespace>.compat.objectstorage.sa-saopaulo-1.oraclecloud.com',
  region: 'sa-saopaulo-1',
  credentials: {
    accessKeyId: process.env.OCI_ACCESS_KEY,
    secretAccessKey: process.env.OCI_SECRET_KEY,
  },
});
```

---

## 8. Checklist de Cutover (Parallel Run 48h)

### Antes de cortar Railway

- [ ] VM OCI respondiendo en < 200ms (curl desde Colombia)
- [ ] Socket.IO KDS probado con Raspberry Pi físico del restaurante
- [ ] ElevenLabs TTS audio reproducido sin cortes en test de 30min
- [ ] pg_restore validado: row counts match Railway
- [ ] Secrets en OCI Vault accesibles desde NestJS
- [ ] Nginx SSL configurado (Let's Encrypt)
- [ ] OCI Load Balancer health check verde

### Cutover

- [ ] Cambiar DNS api.palosdeleños.com → OCI Load Balancer IP
- [ ] TTL reducido a 60s previamente
- [ ] Monitorear logs PM2 por 48h
- [ ] Railway en standby (no apagar hasta 48h)

### Post-cutover

- [ ] Apagar servicios Railway
- [ ] Cancelar plan Railway
- [ ] Confirmar costo OCI < $25 USD/mes

---

## 9. Fase 2 — Preparación para OKE (Cuando escale)

### 9.1 Redis adapter listo pero inactivo

```typescript
// src/socket/socket.module.ts
// TODO Fase 2: Descomentar cuando se migre a OKE
// import { createAdapter } from '@socket.io/redis-adapter';
// io.adapter(createAdapter(pubClient, subClient));
```

### 9.2 Dockerfile multi-stage desde día 1

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 9.3 Terraform para infra OCI desde día 1

Usar Terraform para todo lo que se provisionó manualmente, de modo que el paso a OKE sea cambiar recursos, no reescribir.

---

## 10. Estimado de costos

| Servicio OCI             | Shape / Config      | Costo/mes          |
|--------------------------|---------------------|--------------------|
| VM ARM Ampere A1         | 4 OCPU / 24GB       | **$0 (Free Tier)** |
| OCI DB System PostgreSQL | 1 OCPU / 16GB       | ~$15 USD           |
| Load Balancer            | Flexible 10Mbps     | ~$0 (Free Tier)    |
| Object Storage           | 20 GB               | ~$0.46 USD         |
| OCI Vault                | < 20 secrets        | ~$0.60 USD         |
| Egress data              | < 10 TB/mes         | ~$0 (Free Tier)    |
| **Total**                |                     | **~$16-18 USD/mes**|

**Ahorro vs Railway:** ~$30-35 USD/mes

---

## 11. Riesgos y mitigaciones

| Riesgo                                         | Probabilidad | Mitigación                                                       |
|------------------------------------------------|--------------|------------------------------------------------------------------|
| Socket.IO drop con Nginx                       | Media        | Header `proxy_read_timeout 3600s` + heartbeat de 25s en cliente |
| PM2 cluster: sesiones Socket.IO no compartidas | Alta si >1 worker | En Fase 1 con sticky sessions en Nginx; Fase 2 con Redis adapter |
| OCI Vault latencia en arranque                 | Baja         | Cachear secrets al inicio del proceso NestJS                     |
| DB System down durante migración               | Baja         | Backup Railway disponible por 30 días post-cutover               |

---

## Mapa de tareas

```
01-oci-infra-provisioning     VM ARM, VCN, Load Balancer, DB System, Vault, Object Storage
02-nginx-websocket-config     Reverse proxy Nginx + SSL + WebSocket upgrade headers
03-pm2-nestjs-cluster         PM2 ecosystem.config.js, cluster mode, startup on boot
04-oci-vault-secrets          Migrar Railway env vars a Vault + integración SDK en NestJS
05-database-migration         pg_dump Railway → pg_restore OCI DB System + validación
06-object-storage-migration   Bucket palos-assets + S3Client endpoint swap + migración archivos
07-cutover-parallel-run       48h parallel run, DNS cutover, monitoreo, Railway shutdown
08-phase2-prep                Dockerfile multi-stage, Terraform, Redis adapter comentado
```
