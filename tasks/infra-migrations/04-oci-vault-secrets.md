# Task: Migrar secrets Railway → OCI Vault + integración NestJS

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** `01-oci-infra-provisioning`  
**SDD Ref:** §5 Variables de entorno → OCI Vault

---

## Context

Todos los secrets que hoy viven como variables de entorno en Railway deben migrar a
OCI Vault. NestJS debe leerlos al arranque usando el OCI SDK y cachearlos en memoria
para no incurrir latencia en cada request.

La VM debe tener un Instance Principal configurado en OCI IAM para autenticarse contra
el Vault sin necesidad de almacenar credenciales en la VM.

---

## Requirements

### OCI IAM — Instance Principal

- [ ] Crear Dynamic Group `palos-vm-group` que incluya la VM ARM por OCID
- [ ] Crear Policy `palos-vault-policy` que otorgue al Dynamic Group:
  - `allow dynamic-group palos-vm-group to read secret-family in compartment <compartment>`
- [ ] Verificar que la VM puede leer secrets sin API key explícita (Instance Principal auth)

### Poblar secrets en OCI Vault

Copiar los valores desde Railway a los secrets creados en tarea 01:

| Secret Name             | Valor Origen                    |
|-------------------------|---------------------------------|
| `palos-db-url`          | `DATABASE_URL` de Railway       |
| `palos-elevenlabs-key`  | `ELEVENLABS_API_KEY` de Railway |
| `palos-jwt-secret`      | `JWT_SECRET` de Railway         |
| `palos-nextauth-secret` | `NEXTAUTH_SECRET` de Railway    |
| `palos-oci-access-key`  | Customer Secret Key de tarea 01 |
| `palos-oci-secret-key`  | Customer Secret Key de tarea 01 |

- [ ] Todos los valores son distintos a los de Railway (rotar JWT_SECRET y NEXTAUTH_SECRET)
- [ ] Documentar el proceso de rotación en caso de compromiso

### Integración NestJS

- [ ] Instalar SDK OCI: `npm install oci-secrets oci-common`
- [ ] Crear `src/config/oci-vault.service.ts` que:
  - Use Instance Principal authentication (`InstancePrincipalsAuthenticationDetailsProvider`)
  - Lea los 6 secrets al arrancar la aplicación
  - Los exponga como un objeto tipado con los valores cacheados
  - Lance excepción si algún secret no está disponible (fail-fast al arranque)
- [ ] Crear `src/config/config.module.ts` que use `OciVaultService` en la fase de bootstrap
- [ ] En desarrollo local, leer desde `.env` como hoy (no romper el flujo de desarrollo)

---

## Acceptance Criteria

- [ ] `pm2 start ecosystem.config.js` arranca NestJS sin variables de entorno en el sistema
- [ ] NestJS conecta a la DB usando la URL leída desde Vault (no hardcodeada)
- [ ] Si un secret no existe en Vault, la app falla al arranque con mensaje claro
- [ ] En desarrollo local, `.env` sigue funcionando sin cambios

---

## Files to Create or Modify

- `apps/api/src/config/oci-vault.service.ts`
- `apps/api/src/config/config.module.ts`
- `apps/api/package.json` — agregar `oci-secrets`, `oci-common`
