# OS-559 — Employee Financial Profile

**Epic:** NOM — Nómina  
**Tipo:** Feature  
**Autor:** Nicolas Riveros  
**Fecha:** 2026-06-26  
**Estado:** Implementado (backend), Frontend pendiente

---

## Objetivo

Implementar la estructura base del perfil financiero del empleado: datos bancarios cifrados,
información fiscal mínima y ledger de pagos histórico append-only.

---

## Alcance incluido

- Modelos Prisma: `EmployeeFinancialProfile`, `EmployeeBankAccount`,
  `EmployeeTaxInformation`, `EmployeePaymentHistory`
- `EncryptionService` (AES-256-GCM) reutilizable para cifrado de campos sensibles
- CRUD completo vía GraphQL y REST para perfil, cuentas bancarias e info fiscal
- `PaymentHistory` expuesto como read-only (sin mutation pública)
- 5 permisos nuevos en catálogo RBAC (`nomina.financial.*`)
- Auditoría explícita en operaciones CREATE/UPDATE sobre datos bancarios y fiscales
- Soft delete en perfil y cuentas bancarias
- Solo una cuenta primaria activa por perfil (enforced en service)
- `maskedAccountNumber` y `maskedTaxId` como campos derivados — nunca se devuelve el valor completo
- Tenant isolation obligatoria en todos los endpoints

## Fuera de alcance

- **Lógica tributaria avanzada** (procedimiento 1 vs 2, UVT, retención calculada automáticamente)
- **Integración con motor de nómina**: `payrollLiquidationId` no está incluido todavía (ver §Pendientes)
- **Generación automática de PaymentHistory**: no se genera desde ningún evento del sistema
- **Frontend**: documentado en §Pendiente Frontend
- **Exportación de historial de pagos**
- **Self-service del empleado**: el empleado no puede editar su propio perfil financiero en esta fase

---

## Decisiones técnicas

| Decisión                                                        | Alternativa rechazada   | Razón                                                                                                       |
| --------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| AES-256-GCM (cifrado reversible) para `accountNumber` y `taxId` | bcrypt (one-way)        | Los números de cuenta deben recuperarse para procesar pagos                                                 |
| `primaryBankAccountId` como campo String? sin @relation         | FK con named relation   | Evita dependencia circular EmployeeFinancialProfile ↔ EmployeeBankAccount; se resuelve en application layer |
| `accountLast4` / `taxIdLast4` almacenados en claro              | Descifrar en cada query | Evita descifrado en lecturas de solo visualización                                                          |
| PaymentHistory sin mutation pública                             | CRUD completo           | Es un ledger append-only; la escritura queda en manos del motor de nómina futuro                            |
| GraphQL + REST (patrón idéntico a EmployeeSocialProfile)        | Solo GraphQL            | El proyecto tiene patrón REST para todos los módulos de empleado                                            |
| `EncryptionService` como provider en el módulo                  | Módulo shared global    | Suficiente para la fase actual; se puede promover a módulo shared cuando otro módulo lo necesite            |

---

## Modelo de datos

### Nuevos enums

```
PaymentMethod:         CASH | BANK_TRANSFER | CHECK
BankAccountType:       SAVINGS | CHECKING
FinancialPaymentStatus: PENDING | PAID | FAILED | CANCELLED
```

### Relaciones y cardinalidades

```
EmployeeDetails (1) ──── (0..1) EmployeeFinancialProfile
EmployeeFinancialProfile (1) ──── (1..N) EmployeeBankAccount
EmployeeFinancialProfile (1) ──── (0..1) EmployeeTaxInformation
EmployeeFinancialProfile (1) ──── (0..N) EmployeePaymentHistory
```

### Campos sensibles cifrados

| Campo                    | Tabla                      | Método      | Campo de visualización                 |
| ------------------------ | -------------------------- | ----------- | -------------------------------------- |
| `accountNumberEncrypted` | `employee_bank_accounts`   | AES-256-GCM | `accountLast4` → `maskedAccountNumber` |
| `taxIdEncrypted`         | `employee_tax_information` | AES-256-GCM | `taxIdLast4` → `maskedTaxId`           |

### Índices críticos

- `employee_financial_profiles`: `(tenantId)`, `(employeeDetailsId)` unique
- `employee_bank_accounts`: `(tenantId, financialProfileId)`, `(tenantId, isActive)`
- `employee_tax_information`: `(tenantId, financialProfileId)` unique
- `employee_payment_history`: `(tenantId, financialProfileId)`, `(tenantId, status)`, unique `(financialProfileId, periodYear, periodMonth)`

---

## Permisos RBAC

| Código                          | Descripción                      | Roles con acceso                                |
| ------------------------------- | -------------------------------- | ----------------------------------------------- |
| `nomina.financial.read`         | Leer perfil financiero y cuentas | OWNER, SUPER_ADMIN, MANAGER, SUPERVISOR, NOMINA |
| `nomina.financial.write`        | Crear/editar perfil y cuentas    | OWNER, SUPER_ADMIN, MANAGER                     |
| `nomina.financial.tax.read`     | Leer info fiscal                 | OWNER, SUPER_ADMIN, MANAGER, SUPERVISOR         |
| `nomina.financial.tax.write`    | Editar info fiscal               | OWNER, SUPER_ADMIN, MANAGER                     |
| `nomina.financial.history.read` | Leer historial de pagos          | OWNER, SUPER_ADMIN, MANAGER, SUPERVISOR, NOMINA |

Permisos con ID seeds: `cccccccc-0000-0000-0000-000000000027` al `...000000031`

---

## Auditoría

Eventos auditados explícitamente desde el service (no depende del interceptor HTTP):

| Acción                       | EntityType                 | AuditAction     |
| ---------------------------- | -------------------------- | --------------- |
| Crear perfil financiero      | `EmployeeFinancialProfile` | CREATE          |
| Actualizar perfil financiero | `EmployeeFinancialProfile` | UPDATE          |
| Crear cuenta bancaria        | `EmployeeBankAccount`      | CREATE          |
| Actualizar cuenta bancaria   | `EmployeeBankAccount`      | UPDATE          |
| Soft delete cuenta bancaria  | `EmployeeBankAccount`      | DELETE          |
| Cambiar cuenta primaria      | `EmployeeFinancialProfile` | UPDATE          |
| Crear/editar info fiscal     | `EmployeeTaxInformation`   | CREATE / UPDATE |

Los campos `accountNumberEncrypted` y `taxIdEncrypted` son redactados automáticamente
por `AuditService.redact()` (agregados a `SENSITIVE_FIELDS` en esta implementación).

---

## QA

### Validaciones de campos

- `accountNumber`: solo dígitos, longitud 6-20 caracteres
- `taxId`: obligatorio al crear `TaxInformation`
- Solo una cuenta primaria activa por perfil (enforced en `setPrimaryBankAccount`)
- `employeeDetailsId` debe pertenecer al tenant
- `financialProfileId` debe pertenecer al tenant

### Casos de prueba cubiertos en tests

- `create` — happy path
- `create` — rechaza si employeeDetails no pertenece al tenant
- `create` — rechaza si employee inactivo
- `create` — rechaza perfil duplicado (ConflictException)
- `createBankAccount` — cifra accountNumber, guarda accountLast4
- `createBankAccount` — rechaza si cuenta primaria duplicada
- `setPrimaryBankAccount` — limpia cuenta primaria anterior
- `softDeleteBankAccount` — no hace hard delete
- `upsertTaxInformation` — cifra taxId, guarda taxIdLast4
- `getPaymentHistory` — read-only (sin mutations públicas)
- tenant isolation en todos los métodos

---

## Riesgos y pendientes

### Pendientes técnicos

| Pendiente                                              | Prioridad | Notas                                                                                                                                                                         |
| ------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payrollLiquidationId` en `EmployeePaymentHistory`     | Alta      | Columna nullable a agregar cuando se implemente el motor de nómina persistente (ticket futuro NOM-XX). Por ahora el campo no existe para no crear FK a una tabla inexistente. |
| Lógica de retención en la fuente (Procedimiento 1 y 2) | Alta      | `withholdingRate` se guarda como override manual. La lógica de cálculo automático corresponde a Task04 de NOM-01.                                                             |
| Rotación de clave `ENCRYPTION_KEY`                     | Media     | Si la clave rota, los registros existentes deben re-cifrarse. Pendiente procedimiento de rotación documentado en la wiki ops.                                                 |
| Validación de código bancario colombiano               | Baja      | `bankCode` es String? libre. En una fase posterior se puede agregar un catálogo de bancos colombianos via `EmployeeCatalogOption`.                                            |

### Pendiente Frontend

La UI del perfil financiero no existe en esta fase. El backend está completo y funcional.

Para implementar el frontend se requiere:

1. Tab "Perfil Financiero" en la pantalla de detalle del empleado
2. Sección "Datos Bancarios": listar cuentas, agregar/editar/eliminar, marcar primaria
3. Sección "Información Fiscal": formulario de `EmployeeTaxInformation`
4. Sección "Historial de Pagos": tabla paginada, solo lectura
5. Nunca mostrar número de cuenta completo — usar `maskedAccountNumber`

---

## Migración

**Ruta:** `apps/api/prisma/migrations/20260626000000_os-559-employee-financial-profile/migration.sql`

Contiene:

- 3 `CREATE TYPE` (enums: `PaymentMethod`, `BankAccountType`, `FinancialPaymentStatus`)
- 4 `CREATE TABLE` con índices y FK en CASCADE
- Índices de soft delete y paginación
- Aplicada en DB local vía `prisma db execute` + `prisma migrate resolve --applied`

Para aplicar en staging/prod:

```bash
pnpm prisma migrate deploy
```

---

## ENCRYPTION_KEY — Configuración de seguridad

| Entorno         | Instrucción                     |
| --------------- | ------------------------------- |
| Local `.env`    | `ENCRYPTION_KEY=<64 hex chars>` |
| Railway staging | Secret var `ENCRYPTION_KEY`     |
| Railway prod    | Secret var `ENCRYPTION_KEY`     |

**Generar clave:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Invariantes:**

- La clave debe ser exactamente 64 caracteres hexadecimales (32 bytes)
- Si la clave no está definida, el API lanza error al iniciar (`EncryptionService` constructor)
- Si la clave tiene longitud incorrecta, mismo comportamiento
- **Si la clave rota**, los registros existentes en `accountNumberEncrypted` y `taxIdEncrypted` quedarán indescifrables. Pendiente: procedimiento de rotación con re-cifrado batch (ver §Pendientes)

---

## Archivos implementados

### Nuevos

| Archivo                                                                                       | Descripción                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------- |
| `apps/api/src/common/services/encryption.service.ts`                                          | AES-256-GCM encrypt/decrypt/mask      |
| `apps/api/src/common/test/encryption.service.spec.ts`                                         | Tests unitarios del EncryptionService |
| `apps/api/src/employee-financial-profile/employee-financial-profile.module.ts`                | NestJS module                         |
| `apps/api/src/employee-financial-profile/interfaces/employee-financial-profile.interfaces.ts` | Tipos e interfaces                    |
| `apps/api/src/employee-financial-profile/repository/employee-financial-profile.repository.ts` | Acceso a Prisma                       |
| `apps/api/src/employee-financial-profile/service/employee-financial-profile.service.ts`       | Lógica de negocio                     |
| `apps/api/src/employee-financial-profile/resolver/employee-financial-profile.resolver.ts`     | GraphQL resolver                      |
| `apps/api/src/employee-financial-profile/controller/employee-financial-profile.controller.ts` | REST controller                       |
| `apps/api/src/employee-financial-profile/controller/dto/*.ts`                                 | DTOs REST                             |
| `apps/api/src/employee-financial-profile/test/employee-financial-profile.service.spec.ts`     | Tests del service                     |
| `apps/api/src/employee-financial-profile/test/employee-financial-profile.resolver.spec.ts`    | Tests del resolver                    |

### Modificados

| Archivo                                       | Cambio                                              |
| --------------------------------------------- | --------------------------------------------------- |
| `apps/api/prisma/schema.prisma`               | +3 enums, +4 modelos, +relación en EmployeeDetails  |
| `apps/api/src/audit/service/audit.service.ts` | +campos sensibles financieros a SENSITIVE_FIELDS    |
| `apps/api/prisma/seed.ts`                     | +5 permisos nomina.financial.\*, matrix actualizada |
| `apps/api/src/app.module.ts`                  | +EmployeeFinancialProfileModule                     |
