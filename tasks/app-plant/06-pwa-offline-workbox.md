# Task: PWA offline (vite-plugin-pwa + Workbox)

**Depends on:** `01-scaffold-apps-plant.md`  
**Spec:** § Offline-First Requirements, Technology Stack (vite-plugin-pwa)

---

## Goal

Enable full offline shell: cached assets, SPA navigation fallback, and strategies so operator UI loads without network after first visit.

---

## Scope

- Add `vite-plugin-pwa` with Workbox
- `registerSW` in `main.tsx` (prompt or auto-update per Capgo strategy in task 13)
- Precache `dist` assets; runtime caching for API optional (network-first with timeout)
- `manifest.webmanifest`: `display: standalone`, plant theme colors, icons for tablet home screen
- Document update flow when new bundle deployed

---

## Requirements

- App shell available offline after initial load
- Service worker does not break Capacitor WebView (test on Android)
- Version/hash visible in dev for debugging

---

## Testing strategy

| Test                     | Type                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| SW registration in build | **Build smoke** — `build` generates `sw.js` / workbox bundle        |
| Offline shell            | **Manual / e2e** — Playwright `context.setOffline(true)` in task 15 |
| Timer without SW         | **Unit** — timer store independent (task 04)                        |

No heavy unit tests for Workbox config — validate via build output + e2e.

---

## Acceptance criteria

- [ ] `pnpm turbo build --filter=@restopsiq/plant` includes service worker artifacts
- [ ] Chrome DevTools → Application → offline → app shell still loads
- [ ] Capacitor Android WebView loads app offline after first online open
- [ ] No regression to `turbo dev` HMR

---

## Files likely affected

- `apps/plant/vite.config.ts`
- `apps/plant/package.json`
- `apps/plant/src/main.tsx`
- `apps/plant/public/icons/*`

---

## Out of scope

- Incident upload queue (task 09)
- Capgo (task 13)

---

## Validation commands

```bash
pnpm turbo build --filter=@restopsiq/plant
pnpm --filter @restopsiq/plant preview
# DevTools: offline reload
```
