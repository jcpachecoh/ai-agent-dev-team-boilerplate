# Task 02: GraphQL Interface

**Objetivo:** Exponer las capacidades del `EmployeeService` a través de GraphQL siguiendo el patrón code-first del proyecto.

### Scope:

- `EmployeeObjectType`: Definición de tipos de salida (GraphQL Objects).
- `CreateEmployeeInput` / `UpdateEmployeeInput`: Definición de tipos de entrada.
- `EmployeeResolver`: Implementación de Queries y Mutations reutilizando el `EmployeeService`.
  - Query: `employee(id)`, `employees(filter)` (con soporte para `includeInactive`).
  - Mutation: `createEmployee`, `updateEmployee`.
  - Mutation: `deactivateEmployee(userId: ID!): EmployeeDetails!` (Soft delete mapeado al service, retorna el empleado desactivado).
- Extracción de `tenantId` del contexto GraphQL usando `getTenantIdFromContext`.

### Archivos Permitidos:

- `apps/api/src/payroll/resolver/*`
- `apps/api/src/payroll/dto/*` (Para inputs GQL)
- `apps/api/src/payroll/payroll.module.ts` (Para registrar el resolver)

### Archivos Prohibidos:

- Duplicación de lógica de base de datos en el resolver.
- Archivos fuera del módulo `payroll`.

### Criterios de Aceptación:

- Queries y Mutations funcionales desde Apollo Playground.
- `deactivateEmployee` realiza el soft delete correcto (isActive: false, deletedAt: now) y retorna el `EmployeeDetails` actualizado (no un `Boolean`).
- Consistencia en el manejo de errores con el resto de la API.

### Validaciones:

- `npm run typecheck`
- Unit tests para `EmployeeResolver`.
