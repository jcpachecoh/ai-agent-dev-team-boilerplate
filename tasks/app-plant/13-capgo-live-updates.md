# Task: Capgo live updates (JS deploy without Play Store)

**Depends on:** `07-capacitor-native-shell.md`  
**Spec:** Technology Stack (Capgo), deploy silencioso

---

## Goal

Configure Capgo so production JS bundles can ship to tablets without Play Store review cycle; compatible with PWA SW strategy from task 06.

---

## Scope

- Capgo account/project linkage (env vars: `CAPGO_CHANNEL`, keys in CI secrets — document only in repo, no secrets committed)
- `@capgo/capacitor-updater` or official Capgo plugin per current Capgo docs for Capacitor 6
- Channel strategy: `production` (plant floor), `staging` (QA tablets)
- Post-`vite build` upload step in CI (document `capgo upload` command)
- Rollback procedure documented in README
- Coordinate with Workbox: avoid double-cache conflicts (document order: Capgo bundle vs SW precache)

---

## Testing strategy

- **Manual** — deploy to staging channel, verify version bump on tablet
- **CI smoke** — upload dry-run or mocked CLI
- **No unit tests** required

---

## Acceptance criteria

- [ ] README documents channel setup and upload command
- [ ] Staging tablet receives new JS bundle without APK reinstall
- [ ] Failed update does not brick app (fallback to bundled `dist`)
- [ ] CI pipeline step defined (can be `workflow_dispatch` initially)

---

## Files likely affected

- `apps/plant/package.json`
- `apps/plant/capacitor.config.ts`
- `apps/plant/README.md`
- `.github/workflows/plant-capgo.yml` (optional)

---

## Out of scope

- Play Store release
- Native binary updates (APK still needed for Capacitor major bumps)

---

## Validation commands

```bash
# Documented in README — run against staging device
pnpm turbo build --filter=@restopsiq/plant
# capgo upload ...
```
