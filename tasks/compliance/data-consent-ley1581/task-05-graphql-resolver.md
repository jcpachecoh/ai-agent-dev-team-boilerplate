# Task 05 — GraphQL resolver (contrato móvil + web)

**Domain:** `[BACKEND]` `[GRAPHQL]`  
**Status:** `in_progress`  
**Depends on:** task-04  
**Epic:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Exponer operaciones GraphQL para la app móvil (OS-555, otro repo) y el perfil web.

---

## Queries

### `activeDataProcessingPolicy`

Política vigente del tenant (texto legal + versión).

```graphql
query ActiveDataProcessingPolicy {
  activeDataProcessingPolicy {
    id
    version
    title
    content
    consentLabel
    publishedAt
  }
}
```

Auth: JWT + `x-tenant-id`.

---

### `myDataConsentStatus`

Estado de consentimientos del empleado autenticado.

```graphql
query MyDataConsentStatus {
  myDataConsentStatus {
    activePolicyVersion
    alternateMethodAvailable
    biometricEnrolled
    consents {
      consentType
      granted
      policyVersion
      grantedAt
      revokedAt
      canUseFeature
    }
  }
}
```

---

### `employeeDataConsents(userId: ID!)`

Consulta HR o self-service (mismo `userId` que JWT).

```graphql
query EmployeeDataConsents($userId: ID!) {
  employeeDataConsents(userId: $userId) {
    activePolicyVersion
    alternateMethodAvailable
    biometricEnrolled
    consents {
      consentType
      granted
      policyVersion
      grantedAt
      revokedAt
      canUseFeature
    }
  }
}
```

RBAC: self, o roles nómina/admin con `admin.users.read`.

---

### `dataProcessingPolicies` (SuperAdmin)

Histórico de versiones del tenant.

---

## Mutations

### `grantDataConsent`

```graphql
mutation GrantDataConsent($input: GrantDataConsentInput!) {
  grantDataConsent(input: $input) {
    id
    consentType
    granted
    policyVersion
    grantedAt
  }
}
```

```graphql
input GrantDataConsentInput {
  policyVersion: String!
  consentTypes: [ConsentType!]!
  accepted: Boolean! # debe ser true (checkbox explícito)
  deviceId: String
}
```

Auth: solo el propio empleado. `accepted: false` → `BadRequestException`.

---

### `revokeDataConsent`

```graphql
mutation RevokeDataConsent($input: RevokeDataConsentInput!) {
  revokeDataConsent(input: $input) {
    id
    consentType
    granted
    revokedAt
  }
}
```

```graphql
input RevokeDataConsentInput {
  consentType: ConsentType!
}
```

Auth: solo el propio empleado.

---

### `publishDataProcessingPolicy` (SuperAdmin)

Publica nueva versión y desactiva la anterior del tenant.

---

## Enums

```graphql
enum ConsentType {
  BIOMETRICO_FACIAL
  GEOLOCALIZACION
}
```

---

## Errores de enforcement (REST móvil / marcación)

`403` con cuerpo:

```json
{
  "statusCode": 403,
  "message": "Consentimiento de geolocalización requerido para marcación móvil",
  "code": "CONSENT_REQUIRED",
  "consentType": "GEOLOCALIZACION",
  "alternateMethodAvailable": true
}
```

---

## Files allowed

- `apps/api/src/data-consent/**`
- `apps/api/src/app.module.ts`

---

## Validation

```bash
pnpm --filter api test -- data-consent
node scripts/validate-structure.js
```
