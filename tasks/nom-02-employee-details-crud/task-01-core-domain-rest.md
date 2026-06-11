# Task 01: Core Domain, Validations & REST API

**Objetivo:** Implementar la infraestructura base del dominio de nómina, la lógica de negocio para empleados con validaciones de Colombia y el adaptador REST, incluyendo la creación atómica de User + EmployeeDetails.

### Scope:

- Creación de `PayrollModule` y estructura de carpetas según `MODULE-STRUCTURE.md`.
- `EmployeeRepository`: Consultas Prisma filtradas por `tenantId`.
  - Soporte para Soft Delete (`deletedAt` e `isActive=false`).
  - Opción `includeInactive: boolean` en búsquedas para auditoría.
- `EmployeeService`: Lógica CRUD principal.
  - **Transacción**: `POST /api/v1/employees` debe crear un `User` y sus `EmployeeDetails` de forma atómica.
  - **SMLV_2025**: Usar 1.423.500 como base.
  - **Validaciones Colombia**:
    - `salaryAmount` > 0.
    - `hasTransportSubsidy`: Calculado automáticamente (Salario <= 2 \* SMLV_2025). Ignorar valor manual del body.
    - `contractEnd`: Requerido si `contractType` es `FIJO` o `OBRA`.
    - `PRESTACION`: Salario mínimo de 1 SMLV.
    - `APRENDIZAJE`: Salario entre 0.5 y 1 SMLV.
    - `salaryType INTEGRAL`: Salario mínimo de 13 SMLV (10 salariales + 3 prestacionales).
    - `contractStart` <= `contractEnd` (si aplica).
  - Validar existencia de `locationId` dentro del mismo `tenantId`.
- `EmployeeController`: Endpoints REST bajo `/api/v1/employees` con `ApiHeader('x-tenant-id')`.
- Unit tests para `EmployeeService` y `EmployeeRepository`.

### Archivos Permitidos:

- `apps/api/src/payroll/**/*` (Nueva carpeta)
- `apps/api/src/app.module.ts` (Registro de módulo)
- `apps/api/src/payroll/payroll.constants.ts` (SMLV_2025 = 1423500)

### Archivos Prohibidos:

- `apps/api/prisma/*` (Schema y migraciones cerrados)
- Frontend apps (`apps/web`, etc.)

### Criterios de Aceptación:

- Creación atómica de User + EmployeeDetails funcionando.
- Validaciones de ley Colombia aplicadas correctamente en el Service.
- Soft delete funcional (registros inactivos no aparecen en `findAll` por defecto).
- El `tenantId` es obligatorio en todos los endpoints.
- Cobertura de tests unitarios > 80% en el service.

### Validaciones:

- `npm run typecheck`
- `npm run test -- apps/api/src/payroll`

### Riesgos/Gaps:

- **User Creation**: Se debe reutilizar la lógica de hashing de passwords/pins si existe, o seguir el patrón de `AuthService`.
- **Integridad**: Validar que el `userId` creado no exista previamente en el tenant (aunque Prisma ya tiene el unique).
