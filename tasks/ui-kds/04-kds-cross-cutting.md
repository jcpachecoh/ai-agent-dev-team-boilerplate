# UI-KDS-04: Criterios transversales (touch, flujo, WebSocket, offline)

**Domain:** `[UI-KDS]` `[PLANT]` `[QA]` `[PWA]`  
**Assigned Agent:** frontend-developer, qa-engineer  
**Status:** `pending`  
**Created:** 2026-05-22  
**Depends On:** [01-kds-login-screen.md](./01-kds-login-screen.md), [02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md), [03-kds-complete-phase-screen.md](./03-kds-complete-phase-screen.md), `tasks/app-plant/08-plant-socket-hook.md`, `tasks/app-plant/09-offline-sync-queue.md`

---

## Objetivo

Criterios de aceptación **compartidos** por las tres pantallas KDS. Deben verificarse al cerrar el epic UI-KDS, además de los checklists por pantalla.

---

## 1. Touch-first (sin mouse)

| Requisito                                           | Verificación                                     |
| --------------------------------------------------- | ------------------------------------------------ |
| Toda interacción operativa funciona con dedo/guante | Manual tablet Android / iOS WebView              |
| Targets ≥ 44×44 px (login keypad ≥ **80×80**)       | DevTools computed style + checklist              |
| Sin hover-only affordances                          | Revisión de CSS (`:hover` no es único indicador) |
| Scroll por instrucciones con gesto nativo           | Manual                                           |
| `user-select: none` en teclados donde aplique       | SCSS Plant                                       |

**Pantallas:** Login, Active, Complete.

---

## 2. Flujo ≤ 5 toques (desde llegada a estación)

Meta de producto: operario en **fase en curso** con máximo **5 toques** desde que la tablet está en estación (sesión ya provisionada con `stationId`).

### Camino feliz documentado (ejemplo)

| #   | Toque                                       | Pantalla |
| --- | ------------------------------------------- | -------- |
| 1   | Primer dígito PIN                           | Login    |
| 2–4 | Resto PIN + OK                              | Login    |
| 5   | INICIAR (doble tap cuenta como 1 intención) | Active   |

> Si el flujo exige más toques, documentar desviación y pedir excepción de producto.

### Medición

- Script UX o tabla en PR
- Probar con PIN de demo en staging

---

## 3. WebSocket — tiempo real sin reload

| Requisito                         | Implementación                          |
| --------------------------------- | --------------------------------------- |
| Eventos de fase actualizan UI     | `usePlantSocket` + store de fase        |
| No `location.reload()` en eventos | Code review                             |
| Reconexión exponencial            | `plant-socket.service`                  |
| Indicador conectado/desconectado  | `connectivity.store` en header opcional |

### Eventos mínimos a manejar en UI

```txt
phase:status_changed
phase:assigned
operator:presence_updated
```

**Prueba:** cambiar estado desde backend o mock socket → pantalla Active refleja sin F5.

---

## 4. Offline — cronómetro y sincronización

| Requisito                     | Comportamiento                                               |
| ----------------------------- | ------------------------------------------------------------ |
| Cronómetro corre sin red      | `timer.store` + `setInterval` local                          |
| Pérdida WiFi no congela mm:ss | Manual airplane mode                                         |
| Al reconectar                 | Socket reconnect + `offline-queue` drena acciones pendientes |
| Completar fase offline        | Encola; banner "Se sincronizará al reconectar"               |

**No** depender del servidor para el tick del cronómetro.

### Persistencia

- Timer hidratado desde `localStorage` (`timer.store.hydrate`) al montar Active
- Tras background app: tiempo coherente (task app-plant 04)

---

## 5. Design system y Storybook

| Requisito                                  | Detalle                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| Componentes visuales desde `@restopsiq/ui` | No copiar SCSS de Field Ops a Plant                    |
| Regresión visual                           | Comparar con stories **Field Ops/** antes de merge     |
| Tema KDS producción                        | `theme="dark"` por defecto                             |
| Nuevos patrones UI                         | Primero story en `packages/ui`, luego consumo en Plant |

```bash
pnpm --filter @restopsiq/ui storybook
```

---

## 6. Routing y despliegue

| Requisito       | Detalle                                                         |
| --------------- | --------------------------------------------------------------- |
| Ruta            | `/plant/kds/:stationId/...` o equivalente documentado en router |
| Subdominio      | `planta.restopsiq.co` sirve mismo build Vite                    |
| Deep link login | `/login` con estación en store                                  |

Coordinar con `tasks/app-plant/03-routing-and-screen-shells.md`.

---

## 7. Checklist final epic

- [ ] **100 % touch** — validado en tablet 10" landscape
- [ ] **≤ 5 toques** camino feliz documentado o excepción aprobada
- [ ] **WebSocket** actualiza estado sin recargar página
- [ ] **Offline:** cronómetro local + sync al reconectar
- [ ] Tres pantallas en `apps/plant/src/screens/` usando `@restopsiq/ui`
- [ ] `@restopsiq/ui` en dependencias de `apps/plant`
- [ ] `pnpm turbo test --filter=@restopsiq/plant` verde
- [ ] `pnpm turbo typecheck --filter=@restopsiq/plant` verde
- [ ] Manual E2E: Login → Active → Complete → Pending (task app-plant 15 si aplica)

---

## Comandos de validación

```bash
pnpm --filter @restopsiq/ui typecheck
pnpm --filter @restopsiq/ui storybook
pnpm turbo dev --filter=@restopsiq/plant
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo build --filter=@restopsiq/plant
```

---

## Referencias

- [00-epic.md](./00-epic.md)
- `tasks/app-plant/15-e2e-and-acceptance.md`
- `tasks/packages-ui/05-field-ops-figma-components.md`
