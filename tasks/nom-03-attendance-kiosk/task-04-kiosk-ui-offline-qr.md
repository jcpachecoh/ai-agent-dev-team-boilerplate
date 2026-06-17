# Task 04 — UI Kiosko: Visual, Offline Queue & QR (Fase Posterior)

## Objetivo

Implementar la interfaz visual del kiosko de asistencia en `apps/web-app/` o en una app dedicada,
con soporte offline, sincronización automática al recuperar conectividad y autenticación por QR
como alternativa a cédula+PIN.

> ⚠️ **Esta task NO debe iniciarse hasta que Tasks 01–03 estén mergeadas y el backend esté en producción.**
> El kiosko depende de endpoints estables. Iniciarla antes genera riesgo de desincronización.

---

## Contexto previo al inicio de esta task

Antes de comenzar, verificar:

- [ ] `POST /api/attendance/kiosk-auth` en producción y estable.
- [ ] `POST /api/attendance/entry` y `POST /api/attendance/exit` sin cambios de contrato pendientes.
- [ ] `GET /api/attendance/location/:locationId` retorna empleados activos correctamente.
- [ ] `pinHash` seteado en EmployeeDetails de todos los empleados activos.
- [ ] Decisión de equipo sobre app destino: `apps/web-app/` (nueva pantalla) vs app dedicada.

---

## Scope

### Pantalla principal del kiosko

Estado idle (pantalla en espera):

```
┌─────────────────────────────────┐
│   Sede: Palos de Leña Norte     │
│   Hoy: martes 10 junio 2025     │
│                                 │
│   [Ingresa tu cédula]           │
│   ┌─────────────────────────┐   │
│   │  _ _ _ _ _ _ _ _ _ _   │   │
│   └─────────────────────────┘   │
│                                 │
│   O escanea tu código QR        │
│   [icono QR]                    │
│                                 │
│   Empleados activos: 7          │
└─────────────────────────────────┘
```

Estado de ingreso de PIN (post cédula válida):

```
  Bienvenido, Carlos Mendoza
  Ingresa tu PIN (4–6 dígitos)
  ● ● _ _
  [Registrar Entrada]  [Registrar Salida]
```

Estado de confirmación:

```
  ✅ Entrada registrada
  09:03 a.m.
  Turno mañana | Sede Norte
  (vuelve al idle en 3 segundos)
```

### Flujo de navegación

```
Idle
  → [ingresa cédula] → PinInput
    → [kiosk-auth OK]
      → [ENTRY] → Confirm(ENTRY) → Idle
      → [EXIT]  → Confirm(EXIT, summary: Xh Ym trabajadas) → Idle
    → [kiosk-auth FAIL] → Error → Idle
  → [escanea QR] → QrScanner → PinInput (pre-cargada la cédula) → ...
```

### Offline queue

Reutilizar el patrón existente de `apps/plant/`:

| Artefacto de referencia    | Ruta actual                 | Patrón                                         |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| `offline-queue.service.ts` | `apps/plant/src/services/`  | IndexedDB + deduplicación por `idempotencyKey` |
| `connectivity.store.ts`    | `apps/plant/src/stores/`    | Zustand + ping loop cada 10s                   |
| `STORAGE_KEYS`             | `apps/plant/src/constants/` | Constantes de IndexedDB                        |

El kiosko debe:

1. Generar un `idempotencyKey = nanoid()` al momento del evento (ENTRY/EXIT).
2. Intentar `POST /api/attendance/entry|exit` inmediatamente.
3. Si falla (sin conexión): encolar en IndexedDB con el timestamp local.
4. Al recuperar conectividad: flush de la queue, en orden de timestamp.
5. El backend debe ser idempotente: si recibe el mismo `idempotencyKey` dos veces, retornar el registro existente sin duplicar.

> **Nota para Task 02 (revisión):** El DTO de `registerEntry` y `registerExit` debe aceptar
> un campo `idempotencyKey?: string` opcional. Si el backend lo recibe, hacer upsert por ese key.
> Esto no cambia el contrato básico pero lo hace offline-safe.

### QR como método de autenticación alternativo

El QR no reemplaza el PIN — reduce fricción en el ingreso de la cédula solamente:

```
Contenido del QR: { tenantId, userId, cedula, exp: timestamp }
  firmado con un secreto del servidor (HMAC-SHA256)
```

El kiosko escanea el QR:

1. Valida la firma y el exp (QR expira en 24h).
2. Pre-llena la cédula en el formulario.
3. Solicita PIN igualmente — el QR no exime del PIN.

Endpoint nuevo requerido (revisar en Task 02):

```
POST /api/attendance/generate-qr   (requiere JWT de empleado)
  → retorna QR string firmado con exp de 24h
```

> ⚠️ El QR no debe contener el `pinHash` ni ninguna credencial. Solo identifica al empleado.

### Requisitos técnicos

- **Framework:** Misma stack que `apps/web-app/` (React + Vite + SCSS modules) o `apps/plant/` (según decisión de equipo).
- **Librería de QR:** a definir (no instalar sin aprobación — tocar `package.json` requiere revisión).
- **Modo kiosko:** La pantalla debe ser full-screen, sin navegación lateral, sin acceso al resto de la app.
- **Auto-reset:** Volver a Idle si el usuario no completa el flujo en 60 segundos.
- **Accesibilidad:** Fuentes grandes (min 24px), contraste WCAG AA, teclado numérico virtual para PIN.

---

## Archivos permitidos

```
apps/web-app/src/pages/KioskPage/           ← nueva pantalla completa
apps/web-app/src/features/attendance/       ← hooks, api client, offline queue
apps/web-app/src/constants/navigation.ts   ← agregar ruta /kiosk
apps/plant/src/services/offline-queue.service.ts  ← referencia/copia (no modificar el original)
postman/restopsiq-api.collection.json       ← agregar POST generate-qr si se implementa
```

## Archivos prohibidos

```
apps/api/prisma/schema.prisma         ← schema cerrado
apps/api/src/**                       ← backend cerrado (salvo idempotencyKey en DTO si aplica)
apps/plant/src/**                     ← no modificar el app de planta
package.json / pnpm-lock.yaml         ← no instalar dependencias sin aprobación previa
```

---

## Criterios de aceptación

1. Flujo completo Idle → Cédula → PIN → ENTRY → Confirmación → Idle en < 10 segundos.
2. Flujo Idle → Cédula → PIN → EXIT → Confirmación con horas trabajadas en < 10 segundos.
3. Sin conexión: evento encolado en IndexedDB, UI muestra "Sin conexión — evento guardado".
4. Al recuperar conexión: flush automático, UI confirma sincronización.
5. PIN incorrecto: mensaje de error claro, contador de intentos visible, lockout a los 3.
6. Auto-reset a Idle tras 60 segundos sin actividad.
7. QR escaneado pre-llena cédula (PIN sigue siendo requerido).
8. `pnpm run typecheck` pasa en `apps/web-app/`.
9. Tests de componentes o e2e de UI (Playwright/Vitest) cubren el flujo principal.

---

## Riesgos / Gaps

| Riesgo                                                                                                                           | Impacto | Estrategia                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decisión de app destino:** `web-app` vs app dedicada no está tomada                                                            | Alto    | Bloquear inicio hasta que el equipo decida. Una app dedicada permite modo kiosko nativo en tablet                                                 |
| **Librería QR:** instalar `qr-scanner` o similar requiere revisión de dependencias                                               | Medio   | Definir antes de iniciar. Alternativa: usar la cámara nativa con `getUserMedia` + `BarcodeDetector` API (sin librería, soporte Chrome 88+)        |
| **Seguridad del QR:** el QR firmado puede ser fotocopiado o reutilizado                                                          | Medio   | El `exp` de 24h mitiga el riesgo. Para mayor seguridad: exp de 5 minutos + one-time-use (requiere Redis — fuera de scope de esta task)            |
| **Modo kiosko en tablet:** el navegador puede permitir salir con gestos                                                          | Bajo    | Usar Kiosk Mode de Chrome o PWA con `display: fullscreen`. Documentar configuración del dispositivo                                               |
| **Offline + reloj del dispositivo:** si el reloj del tablet está desincronizado, el timestamp del evento offline será incorrecto | Medio   | El servidor debe ignorar el `timestamp` del body del cliente offline y usar `serverTime = new Date()` al momento de recibir el evento en el flush |
| **QR y offline:** generar QR requiere conexión (firma del servidor). Sin conexión solo funciona cédula+PIN                       | Bajo    | Documentado. El QR es conveniencia, no requisito para marcar asistencia                                                                           |

---

## Dependencias previas a esta task

| Dependencia                            | Estado esperado al iniciar Task 04               |
| -------------------------------------- | ------------------------------------------------ |
| Task 01 (schema)                       | Mergeada a main                                  |
| Task 02 (backend)                      | Mergeada a main, endpoints en staging            |
| Task 03 (tests)                        | Mergeada a main, CI verde                        |
| `idempotencyKey` en DTOs de Task 02    | Revisado y aceptado (puede requerir PR separado) |
| Decisión de equipo sobre app destino   | Tomada y documentada                             |
| Aprobación de librería QR              | Tomada por tech lead                             |
| PINs configurados en empleados activos | Operación de datos completada                    |
