# Task 03: Plugin Bluetooth (scan / connect)

**Domain:** `[FRONTEND]` / `[MOBILE]`  
**Depends on:** `01-capacitor-init-and-platforms.md`, **`00-epic-and-decisions.md` D1 cerrada**  
**Status:** `blocked` hasta confirmar BLE vs impresora térmica

---

## Goal

Permitir **escanear y conectar** dispositivos Bluetooth desde la app Planta nativa, según el hardware acordado con operaciones.

---

## Scope (según decisión D1)

### Opción A — BLE (`@capacitor-community/bluetooth-le`) — default si no hay otra indicación

- Instalar `@capacitor-community/bluetooth-le`
- Servicio `bluetooth.service.ts`:
  - `initialize()` / permisos
  - `startScan(services?: string[])` / `stopScan()`
  - `connect(deviceId)` / `disconnect()`
  - Eventos: dispositivo encontrado, conectado, desconectado, error
- UI mínima de diagnóstico (pantalla técnica o modal supervisor): lista de dispositivos + botón conectar
- UUIDs de servicio documentados en `.env.example` o config si el hardware lo define

### Opción B — Impresora térmica ESC/POS

- **No usar BLE genérico** si el hardware es Bluetooth clásico (SPP).
- Evaluar plugin específico o capacitor plugin custom (Android primero; iOS suele ser limitado).
- Documentar modelo exacto de impresora antes de codificar.

### Opción C — Adapter pattern

- `IBluetoothDeviceAdapter` con implementaciones `BleAdapter` / `WebMockAdapter`
- Facilita tests y desarrollo sin hardware

---

## Out of scope

- Protocolo de impresión completo (tickets, etiquetas) — solo connect MVP salvo que producto lo pida
- Permisos nativos detallados (task 04)
- Firmware del dispositivo

---

## Files allowed

- `apps/plant/package.json`
- `apps/plant/src/services/bluetooth.service.ts`
- `apps/plant/src/services/bluetooth.service.test.ts`
- `apps/plant/src/hooks/useBluetooth.ts` (opcional)
- Pantalla/modal de diagnóstico Bluetooth en `apps/plant/src/**`
- `apps/plant/.env.example` (UUIDs / flags)

---

## Files forbidden

- `packages/**`
- `apps/api/**`
- `pnpm-lock.yaml` sin aprobación

---

## Acceptance criteria

- [ ] Decisión D1 documentada en `00-epic-and-decisions.md` (BLE / impresora / ambos)
- [ ] Scan lista al menos un dispositivo de prueba en **Android** físico
- [ ] Connect establece sesión y emite estado conectado
- [ ] En **iOS/iPad**: scan/connect probado si el periférico es compatible con iOS; si no, documentar limitación
- [ ] Web: mock o mensaje “solo disponible en app nativa”
- [ ] Tests unitarios del servicio con mocks

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant test
pnpm --filter @restopsiq/plant typecheck
# Manual (dispositivo + periférico BLE encendido):
cd apps/plant && pnpm build && npx cap sync && npx cap run android
```

---

## Pregunta para producto / operaciones (copiar en ticket)

> ¿El Bluetooth en planta es para **balanza/sensor BLE**, **impresora térmica de etiquetas**, u otro? ¿Marca y modelo?
