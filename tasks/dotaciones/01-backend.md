# Dotaciones — Backend

**Epic:** NOM — Nómina  
**Ticket de referencia:** OS-5XX (Dotación Art. 230 CST)  
**Tipo:** Feature  
**Área:** Backend (NestJS + Prisma + GraphQL)  
**Rama base:** `develop`  
**Rama sugerida:** `feat/dotaciones-backend`

---

## Contexto legal y de negocio

Obligación Art. 230 CST: entrega trimestral de calzado y vestido de labor a empleados con
salario ≤ 2 SMLV y antigüedad > 3 meses. Períodos: 30-abr, 31-ago, 20-dic.
No es salario → no genera prestaciones.

La dotación ahora se resuelve contra el catálogo real de `InventoryItem`
(category = DOTACION), no contra texto libre. Cada entrega confirmada genera
automáticamente un `InventoryMovement` que descuenta stock.

---

## Dependencias externas que se deben verificar antes de implementar

| Dependencia                               | Ticket | Qué verificar                                                        |
| ----------------------------------------- | ------ | -------------------------------------------------------------------- |
| `InventoryItem` con campo `category`      | OS-481 | Confirmar nombre real del modelo y enum de categorías                |
| `InventoryMovement` y tipos de movimiento | OS-471 | Confirmar enum/tabla de tipos; reutilizar tipo "Entrega de dotación" |
| Comprobante firmado en bucket R2          | OS-493 | Confirmar URL del bucket y patrón de subida usado                    |
| Salario base en `EmployeeDetails`         | NOM-06 | Campo exacto para comparar con 2 SMLV                                |

---

## TASK-BE-01 — Migración Prisma: modelo DotacionDelivery + enum

**Archivo:** `apps/api/prisma/schema.prisma`  
**Migración:** `prisma/migrations/YYYYMMDD_dotacion-delivery/migration.sql`

### Qué agregar

```
enum DotacionStatus {
  PENDIENTE
  ENTREGADA
  NO_APLICA
}

model DotacionDelivery {
  id                  String         @id @default(cuid())
  tenantId            String
  employeeId          String
  period              String         // "2026-04" | "2026-08" | "2026-12"
  inventoryItemId     String
  size                String?        // debe existir en InventoryItem.availableSizes
  quantity            Int            @default(1)
  deliveredAt         DateTime?
  status              DotacionStatus
  signedReceiptUrl    String?
  inventoryMovementId String?
  deletedAt           DateTime?

  inventoryItem     InventoryItem      @relation(fields: [inventoryItemId], references: [id])
  inventoryMovement InventoryMovement? @relation(fields: [inventoryMovementId], references: [id])

  @@index([tenantId])
  @@index([employeeId])
  @@index([inventoryItemId])
  @@index([deletedAt])
}
```

### Agregar relación inversa en InventoryItem

```
dotacionDeliveries DotacionDelivery[]
```

### Agregar relación inversa en InventoryMovement

```
dotacionDelivery DotacionDelivery?
```

### Validaciones antes de migrar

- Confirmar que `InventoryItem` tiene campo `availableSizes` (array o tabla relacionada)
- Confirmar que `InventoryMovement` existe en el schema
- Confirmar que no hay conflicto de nombres con el enum `DotacionStatus`

---

## TASK-BE-02 — Lógica de elegibilidad de empleados

**Método:** `DotacionService.generatePeriodEntitlements(tenantId, period)`

### Criterios de elegibilidad (ambos deben cumplirse)

1. **Salario ≤ 2 SMLV**: comparar contra el valor del SMLV vigente.
   - El SMLV debe ser configurable por tenant o constante de entorno — no hardcodeado.
   - Campo de referencia en `EmployeeDetails`: verificar cuál campo usa NOM-06 para el salario base.
2. **Antigüedad > 3 meses**: `hireDate` (o campo equivalente) < fecha actual − 90 días.
3. **Empleado activo**: `deletedAt: null` y `status = ACTIVE` (o equivalente).

### Comportamiento esperado

- Para un período dado (ej. "2026-04"), recorre todos los empleados elegibles del tenant.
- Para cada elegible, crea registros `DotacionDelivery` con `status = PENDIENTE` si aún no existen para ese período.
- Operación **idempotente**: si ya existe un registro para `(employeeId, period)`, no duplica.
- Retorna lista de empleados procesados con su estado (creado / ya existía).

### Edge cases a cubrir en tests

- Empleado que sube de salario después del corte y deja de ser elegible en el siguiente período.
- Empleado contratado hace menos de 3 meses: no debe aparecer.
- Empleado inactivo (soft-deleted): no debe aparecer.
- Ejecución doble del mismo período: no genera duplicados.

---

## TASK-BE-03 — Consulta de ítems disponibles para dotación

**Método:** `DotacionService.getAvailableItemsForDelivery(tenantId)`

### Qué retorna

Lista de `InventoryItem` del tenant donde:

- `category = DOTACION` (calzado, vestido de labor)
- `stock > 0` (al menos una unidad disponible)
- `deletedAt: null`

### Datos a incluir por ítem

- `id`, `name`, `category`
- `availableSizes` (o estructura equivalente de tallas/variantes)
- Stock disponible por talla (si el inventario maneja stock por variante)

### Notas de implementación

- Si `InventoryItem` maneja stock a nivel de variante/talla, filtrar también por `variantStock > 0`.
- Si maneja stock agregado, un solo check es suficiente.
- Este método es read-only: no modifica nada.

---

## TASK-BE-04 — Registro de entrega con descuento de inventario

**Método:** `DotacionService.registerDotacionDelivery(input, tenantId)`

### Input

```
{
  dotacionDeliveryId: string   // registro PENDIENTE existente
  inventoryItemId: string
  size: string | null
  quantity: number
  deliveredAt: DateTime
  signedReceiptUrl?: string    // URL en R2 (ya subida por el FE)
}
```

### Flujo (transacción atómica)

1. Cargar `DotacionDelivery` por `id` + validar que pertenece al tenant.
2. Validar que `status = PENDIENTE` (rechazar si ya está ENTREGADA o NO_APLICA).
3. Validar que `inventoryItemId` pertenece al tenant y tiene `category = DOTACION`.
4. Validar que la `size` solicitada existe en `InventoryItem.availableSizes` (si aplica).
5. **Validar stock suficiente** para `inventoryItemId` + `size` + `quantity`:
   - Si no hay stock: lanzar `ConflictException` con mensaje claro para RRHH/Inventario.
6. Dentro de una transacción Prisma:
   a. Crear `InventoryMovement` de tipo "Entrega de dotación" / "Despacho" (reutilizar catálogo OS-471).
   b. Descontar stock en `InventoryItem` (o variante correspondiente).
   c. Actualizar `DotacionDelivery`:
   - `status = ENTREGADA`
   - `deliveredAt`
   - `inventoryMovementId` (FK al movimiento creado)
   - `signedReceiptUrl` (si se provee)
   - `inventoryItemId`, `size`, `quantity`
7. Retornar `DotacionDelivery` actualizado con `inventoryMovement` incluido.

### Edge cases a cubrir en tests

- Stock exactamente igual a la cantidad solicitada: debe pasar.
- Stock menor a la cantidad solicitada: debe rechazar.
- Intento de registrar entrega en estado NO_APLICA: debe rechazar.
- Intento de re-entregar: debe rechazar (status ya = ENTREGADA).
- El movimiento de inventario generado debe coincidir en cantidad y tipo con lo entregado.

---

## TASK-BE-05 — Marcar dotación como NO_APLICA

**Método:** `DotacionService.markAsNotApplicable(id, tenantId, reason?)`

### Comportamiento

- Solo aplica si `status = PENDIENTE`.
- No genera movimiento de inventario.
- Registrar razón opcional (campo `String?` en el modelo o en metadata).
- Soft delete NO aplica aquí — el registro se mantiene para auditoría.

---

## TASK-BE-06 — GraphQL Resolver

**Archivo:** `apps/api/src/modules/dotaciones/dotaciones.resolver.ts`

### Queries

| Query                                      | Guard        | Descripción                                                  |
| ------------------------------------------ | ------------ | ------------------------------------------------------------ |
| `dotacionPeriod(period: String!)`          | JwtAuthGuard | Checklist de dotaciones del tenant para un período           |
| `availableItemsForDotacion`                | JwtAuthGuard | Ítems de inventario disponibles (category=DOTACION, stock>0) |
| `dotacionDelivery(id: ID!)`                | JwtAuthGuard | Detalle de un registro individual                            |
| `employeeDotacionHistory(employeeId: ID!)` | JwtAuthGuard | Historial de entregas de un empleado (para OS-531)           |

### Mutations

| Mutation                                                  | Guard        | Descripción                                           |
| --------------------------------------------------------- | ------------ | ----------------------------------------------------- |
| `generatePeriodEntitlements(period: String!)`             | JwtAuthGuard | Genera registros PENDIENTE para elegibles del período |
| `registerDotacionDelivery(input: RegisterDotacionInput!)` | JwtAuthGuard | Confirma entrega + descuenta inventario               |
| `markDotacionNotApplicable(id: ID!, reason: String)`      | JwtAuthGuard | Marca como NO_APLICA                                  |

### Notas

- `tenantId` siempre desde `@CurrentUser() user: JwtPayload` — nunca desde el input.
- Todos los resolvers de negocio con `@UseGuards(JwtAuthGuard)`.

---

## TASK-BE-07 — Reporte exportable de cumplimiento

**Método:** `DotacionService.generateComplianceReport(tenantId, period, sedeId?)`

### Qué retorna

Datos estructurados para exportar a CSV/Excel:

| Campo            | Descripción                       |
| ---------------- | --------------------------------- |
| Empleado         | Nombre, documento                 |
| Sede             | Nombre de la sede                 |
| Período          | "2026-04"                         |
| Ítem entregado   | Nombre del InventoryItem          |
| Talla            | Si aplica                         |
| Estado           | PENDIENTE / ENTREGADA / NO_APLICA |
| Fecha de entrega | Si está ENTREGADA                 |
| Comprobante      | URL del recibo firmado            |

### Formato de exportación

- Exponer como endpoint REST (adicional al GraphQL): `GET /dotaciones/report?period=2026-04&sedeId=xxx`
- Respuesta: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` o CSV.
- Si se usa una librería de Excel, verificar cuál ya usa el proyecto antes de agregar una nueva.

---

## TASK-BE-08 — Estructura del módulo

```
apps/api/src/modules/dotaciones/
├── dotaciones.module.ts
├── dotaciones.resolver.ts
├── dotaciones.service.ts
├── dotaciones.controller.ts       ← REST para reporte exportable
├── dto/
│   ├── register-dotacion.input.ts
│   ├── generate-entitlements.input.ts
│   └── dotacion-compliance-report.dto.ts
├── entities/
│   └── dotacion-delivery.entity.ts
└── dotaciones.service.spec.ts
```

Registrar `DotacionesModule` en `AppModule`.

---

## TASK-BE-09 — Tests unitarios

**Archivo:** `apps/api/src/modules/dotaciones/dotaciones.service.spec.ts`

### Casos obligatorios (cobertura mínima 80%)

#### generatePeriodEntitlements

- [ ] Crea registros PENDIENTE para empleados elegibles
- [ ] No duplica si el período ya fue procesado (idempotencia)
- [ ] Excluye empleados con salario > 2 SMLV
- [ ] Excluye empleados con antigüedad < 3 meses
- [ ] Excluye empleados inactivos (soft-deleted)
- [ ] Empleado que sube de salario: no elegible en período siguiente

#### registerDotacionDelivery

- [ ] Happy path: entrega exitosa + movimiento generado + stock descontado
- [ ] Rechaza si stock < quantity
- [ ] Rechaza si stock = 0
- [ ] Rechaza si status = ENTREGADA (ya entregada)
- [ ] Rechaza si status = NO_APLICA
- [ ] Rechaza si talla no existe en availableSizes
- [ ] El `InventoryMovement` generado coincide en tipo, cantidad e ítem con la entrega
- [ ] Tenant isolation: no puede acceder a dotaciones de otro tenant

#### getAvailableItemsForDelivery

- [ ] Solo retorna ítems con category = DOTACION
- [ ] Solo retorna ítems con stock > 0
- [ ] Tenant isolation

---

## Criterios de aceptación backend

- [ ] Migración aplicable sin errores en DB limpia y con datos existentes
- [ ] `generatePeriodEntitlements` es idempotente
- [ ] No se puede registrar entrega sin stock suficiente (`ConflictException`)
- [ ] Cada entrega genera exactamente un `InventoryMovement` dentro de la misma transacción
- [ ] `inventoryMovementId` queda guardado en `DotacionDelivery`
- [ ] `tenantId` filtrado en todos los métodos del service
- [ ] `deletedAt: null` filtrado en todos los queries
- [ ] Paginación cursor-based en `dotacionPeriod` y `employeeDotacionHistory`
- [ ] Tests pasan con `pnpm test --coverage` (≥ 80% en el service)
- [ ] `pnpm lint` y `pnpm typecheck` en verde
