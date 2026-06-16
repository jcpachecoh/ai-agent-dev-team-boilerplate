# Epic: Plant KDS (`apps/plant`)

**Spec:** [`specs/restopsiq-plant-context.md`](../../specs/restopsiq-plant-context.md)  
**Stack:** Vite 5 + React 18 + TypeScript + Capacitor 6 + Zustand + PWA + Socket.io  
**Out of scope:** Next.js, SSR, SSG, SEO

**Status (2026-05-20):** Infra implementada en `apps/plant`. Pantallas UI **diferidas** (tareas 03, 10–12, 15).

---

## Goal

Deliver an offline-first industrial KDS as a static SPA packaged for Android tablets (Capacitor), with supervisor real-time dashboards and station-bound operator tablets.

---

## Task order (dependencies)

| #   | Task                             | Depends on     | Status                                    |
| --- | -------------------------------- | -------------- | ----------------------------------------- |
| 01  | Scaffold `apps/plant`            | —              | ✅ Done                                   |
| 02  | SCSS industrial preset           | 01             | ✅ Done                                   |
| 03  | Routing + screen shells          | 01, 02         | ⏸ Deferred (UI)                           |
| 04  | Zustand stores + unit tests      | 01             | ✅ Done                                   |
| 05  | `stationId` provisioning         | 04, 07         | ✅ Done                                   |
| 06  | PWA offline (Workbox)            | 01             | ✅ Done                                   |
| 07  | Capacitor shell + native plugins | 01, 06         | ✅ Done (run `cap add android` on device) |
| 08  | `usePlantSocket` + connectivity  | 04, 06         | ✅ Done                                   |
| 09  | Offline sync queue               | 04, 06, 08     | ✅ Done                                   |
| 10  | Operator: Login                  | 03, 04, 05     | ⏸ Deferred (UI)                           |
| 11  | Operator: phase flow screens     | 03, 04, 08, 09 | ⏸ Deferred (UI)                           |
| 12  | Supervisor screens               | 03, 08         | ⏸ Deferred (UI)                           |
| 13  | Capgo live updates               | 07             | ✅ Done                                   |
| 14  | Android APK + kiosk + wake lock  | 07, 11         | ✅ Done (hook + docs; APK on device)      |
| 15  | E2E + acceptance validation      | 01–14          | ⏸ Deferred (UI)                           |

---

## Global acceptance criteria (epic)

- [x] `pnpm turbo dev --filter=@restopsiq/plant` serves the app locally
- [ ] Production builds generate installable Android APK (Android 10+) — requires `cap add android` + Gradle on technician machine
- [x] `stationId` persists via Preferences / localStorage + launch URL `?stationId=`
- [x] Wake lock hook wired to session (`useWakeLock`) — full UX when Login (task 10) sets session
- [x] Timer + offline queue implemented with unit tests
- [ ] Supervisor dashboard updates in real time without reload — needs task 12 UI
- [ ] Operator bundle target ~120KB gzipped — run `pnpm report:bundle` after UI split (current main chunk ~50KB gzip)

---

## Testing strategy (epic)

| Layer                         | Tool                                      | When                |
| ----------------------------- | ----------------------------------------- | ------------------- |
| Stores, queue, socket helpers | Vitest (unit)                             | Tasks 04, 09, 08 ✅ |
| Screen components             | Vitest + Testing Library                  | Tasks 10, 11 ⏸      |
| PWA / Capacitor / APK         | Manual + device smoke                     | Tasks 06, 07, 14    |
| Full operator journey         | Playwright (e2e) or device script         | Task 15 ⏸           |
| Real-time + backend           | Integration (mock API + optional staging) | Task 15 ⏸           |

No NestJS/backend tasks in this folder — assume Plant API/WebSocket gateway exists or is mocked per task.
