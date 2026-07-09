# Dotaciones — Frontend

**Epic:** NOM — Nómina  
**Ticket de referencia:** OS-5XX (Dotación Art. 230 CST)  
**Tipo:** Feature  
**Área:** Frontend (Vite + React + Apollo Client)  
**Rama base:** `develop`  
**Rama sugerida:** `feat/dotaciones-frontend`  
**Dependencia:** `feat/dotaciones-backend` mergeado y disponible en staging

---

## Contexto de UX

Vista "Dotación" es un sub-ítem del módulo de nómina en el sidebar.
Permite a RRHH visualizar el checklist de entregas por período y sede,
registrar entregas usando el catálogo real de inventario (no texto libre),
y subir comprobantes firmados.

---

## TASK-FE-01 — Ruta y navegación

**Archivos a modificar:**

- Router principal de la app (donde viven las rutas de nómina)
- Sidebar/nav de nómina

### Qué agregar

- Ruta: `/payroll/dotaciones` (sub-ruta de nómina, consistente con otras rutas del módulo)
- Ítem en sidebar de nómina: "Dotación" — posicionar después de los ítems existentes de nómina
- Lazy-load del componente de la vista para no inflar el bundle de nómina

### Notas

- Verificar cómo están estructuradas las rutas actuales de nómina antes de agregar.
- Usar el mismo patrón de guards de ruta que usan las demás vistas de nómina.

---

## TASK-FE-02 — Queries y Mutations GraphQL

**Directorio:** `apps/web-app/src/graphql/` (o donde viven los demás `.graphql` de nómina)

### Queries a definir

```graphql
# Checklist del período actual para el tenant
query DotacionPeriod($period: String!, $sedeId: ID, $cursor: String, $take: Int) {
  dotacionPeriod(period: $period, sedeId: $sedeId, cursor: $cursor, take: $take) {
    edges {
      id
      employee {
        id
        fullName
        documentNumber
        sede {
          name
        }
      }
      period
      inventoryItem {
        id
        name
        category
      }
      size
      quantity
      status
      deliveredAt
      signedReceiptUrl
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Catálogo de inventario disponible para dotación
query AvailableItemsForDotacion {
  availableItemsForDotacion {
    id
    name
    availableSizes # ajustar nombre real del campo
    stockAvailable # ajustar nombre real del campo
  }
}

# Historial de dotaciones de un empleado (para perfil del empleado)
query EmployeeDotacionHistory($employeeId: ID!, $cursor: String) {
  employeeDotacionHistory(employeeId: $employeeId, cursor: $cursor) {
    edges {
      id
      period
      inventoryItem {
        name
      }
      size
      quantity
      status
      deliveredAt
      signedReceiptUrl
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Mutations a definir

```graphql
mutation GeneratePeriodEntitlements($period: String!) {
  generatePeriodEntitlements(period: $period) {
    processed
    created
    skipped
  }
}

mutation RegisterDotacionDelivery($input: RegisterDotacionInput!) {
  registerDotacionDelivery(input: $input) {
    id
    status
    deliveredAt
    inventoryMovementId
    signedReceiptUrl
  }
}

mutation MarkDotacionNotApplicable($id: ID!, $reason: String) {
  markDotacionNotApplicable(id: $id, reason: $reason) {
    id
    status
  }
}
```

### Notas de implementación

- Verificar campos reales en el schema generado por el backend antes de finalizar las queries.
- Ajustar nombres de campos de `InventoryItem` según lo que retorne el backend (OS-481).

---

## TASK-FE-03 — Vista principal "Dotación"

**Archivo:** `apps/web-app/src/pages/payroll/DotacionPage.tsx`  
**Estilos:** `DotacionPage.module.scss`

### Layout de la vista

```
┌─────────────────────────────────────────────────────────────┐
│ Dotación                                       [Generar período ▼] │
├──────────────────┬──────────────────────────────────────────┤
│ Período:  [▼]   │ Sede: [▼]                                 │
├──────────────────┴──────────────────────────────────────────┤
│ Resumen:  ✓ Entregadas: 12   ⏳ Pendientes: 5   — N/A: 2   │
├─────────────────────────────────────────────────────────────┤
│ Checklist de empleados                      [Exportar reporte] │
│                                                             │
│ [tabla/lista de registros por empleado]                     │
└─────────────────────────────────────────────────────────────┘
```

### Selector de período

- Opciones predefinidas: "Abril (30-abr)", "Agosto (31-ago)", "Diciembre (20-dic)"
- Año: selector adicional o incluido en el label
- Default: período más próximo al calendario

### Filtro por sede

- Dropdown con sedes del tenant
- Opción "Todas las sedes"

### Tabla/checklist de registros

Columnas:

| Empleado   | Sede  | Ítem asignado     | Talla | Estado    | Acción              |
| ---------- | ----- | ----------------- | ----- | --------- | ------------------- |
| Juan Pérez | Norte | Zapatos seguridad | 42    | PENDIENTE | [Registrar entrega] |
| Ana García | Sur   | Uniforme          | S     | ENTREGADA | [Ver comprobante]   |

- Estado con badge de color:
  - `PENDIENTE` → naranja/amarillo
  - `ENTREGADA` → verde
  - `NO_APLICA` → gris
- Paginación cursor-based (botón "Cargar más")
- Estados obligatorios: `<DotacionListSkeleton />` mientras carga, `<ErrorState />` si falla, `<EmptyState />` si no hay registros

### Botón "Generar período"

- Dispara `GeneratePeriodEntitlements` para el período seleccionado
- Confirmar con modal antes de ejecutar (acción potencialmente masiva)
- Mostrar resumen de resultado: "X empleados procesados, Y nuevos registros creados"

---

## TASK-FE-04 — Modal de registro de entrega

**Archivo:** `apps/web-app/src/features/payroll/dotaciones/RegisterDotacionModal.tsx`

### Flujo del modal

1. Abre desde el botón "Registrar entrega" en la fila del empleado.
2. Muestra datos del empleado (nombre, documento, sede).
3. **Selector de ítem**: dropdown poblado desde `availableItemsForDotacion`.
   - Cada opción muestra nombre del ítem + stock disponible: `"Zapatos de seguridad (stock: 8)"`
   - Si stock = 0, la opción está deshabilitada y marcada como sin stock.
4. **Selector de talla**: aparece al seleccionar ítem, listado de tallas disponibles con su stock.
   - Si el ítem no maneja tallas, este campo no aparece.
5. **Cantidad**: input numérico, mínimo 1, máximo = stock disponible de la talla/ítem.
6. **Fecha de entrega**: date picker, default = hoy.
7. **Comprobante firmado** (opcional): uploader de archivo (ver TASK-FE-05).
8. Botón "Confirmar entrega":
   - Ejecuta `RegisterDotacionDelivery`.
   - Muestra spinner durante la operación.
   - Si el backend rechaza por falta de stock: mostrar error específico ("Sin stock suficiente para [ítem] talla [X]").
   - Si éxito: cerrar modal + actualizar lista (Apollo cache o refetch).

### Validaciones frontend (zod)

```
{
  inventoryItemId: z.string().min(1, 'Selecciona un ítem'),
  size: z.string().optional(),  // requerido si el ítem tiene tallas
  quantity: z.number().min(1).max(stockDisponible),
  deliveredAt: z.date({ required_error: 'Fecha de entrega requerida' }),
}
```

### Notas

- El stock visible en el selector es orientativo — el backend hace la validación final.
- Si el backend rechaza por stock, no cerrar el modal: mostrar el error inline.

---

## TASK-FE-05 — Uploader de comprobante firmado

**Archivo:** `apps/web-app/src/features/payroll/dotaciones/DotacionReceiptUploader.tsx`

### Comportamiento

- Acepta: PDF, JPG, PNG. Tamaño máximo: 5 MB.
- Subida directa a R2 (ver patrón de OS-493 — verificar cómo hace el uploader de fotos de empleados).
- El componente retorna la URL del archivo subido.
- La URL se pasa en el input de `RegisterDotacionDelivery`.
- Si no se sube comprobante, el campo es opcional — la entrega se puede registrar sin él.
- Estado visual: idle → uploading (progress) → uploaded (preview/nombre del archivo) → error.

### Reutilización

- Antes de crear uno nuevo, verificar si existe un componente `FileUploader` o `ReceiptUploader`
  genérico en el proyecto. Si existe, extender o configurar en lugar de crear desde cero.

---

## TASK-FE-06 — Modal "Marcar como N/A"

**Archivo:** `apps/web-app/src/features/payroll/dotaciones/MarkNotApplicableModal.tsx`

### Comportamiento

- Abre desde menú contextual (⋮) en la fila del empleado.
- Campo opcional: razón de la no aplicabilidad.
- Confirmar con botón "Marcar como N/A".
- Dispara `MarkDotacionNotApplicable`.
- Actualizar lista al cerrar.

---

## TASK-FE-07 — Exportar reporte de cumplimiento

**Implementación:** Botón "Exportar reporte" en la vista principal.

### Comportamiento

- Llama al endpoint REST del backend: `GET /dotaciones/report?period=YYYY-MM&sedeId=xxx`
- Descarga directa en el navegador (no abre nueva pestaña).
- El archivo se llama: `reporte-dotacion-{period}-{sede}.xlsx` (o `.csv`).
- Deshabilitar el botón mientras la descarga está en curso.
- Mostrar error toast si el endpoint falla.

### Implementación de descarga

```typescript
// Patrón de descarga de archivo binario — verificar si ya existe util en el proyecto
const response = await fetch(`/api/dotaciones/report?period=${period}&sedeId=${sedeId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
// trigger download...
```

---

## TASK-FE-08 — Historial de dotaciones en Perfil del Empleado (OS-531)

**Archivo a modificar:** Vista de perfil del empleado (verificar ruta exacta en el proyecto)

### Qué agregar

- Nueva tab o sección "Dotaciones" en el perfil del empleado.
- Lista paginada (cursor-based) con las entregas históricas del empleado.
- Columnas: Período, Ítem, Talla, Estado, Fecha de entrega, Comprobante (link si existe).
- Solo lectura — no hay acciones desde el perfil.
- Si no hay entregas: `<EmptyState message="Sin historial de dotaciones" />`.
- Usar query `EmployeeDotacionHistory`.

### Notas

- OS-531 puede tener más contexto sobre la estructura del perfil del empleado.
  Verificar ese ticket antes de implementar para no duplicar tabs.

---

## TASK-FE-09 — Skeleton y estados vacíos

**Archivos:**

- `DotacionListSkeleton.tsx` — skeleton de la tabla de checklist
- Reusar `ErrorState` y `EmptyState` existentes en el proyecto (verificar ubicación)

### DotacionListSkeleton

- 5 filas de skeleton que imiten la estructura de la tabla de checklist.
- Usar el patrón de skeleton que ya usan otros listados del proyecto.

---

## Criterios de aceptación frontend

- [ ] Sub-ítem "Dotación" visible en sidebar de nómina y navega a `/payroll/dotaciones`
- [ ] Selector de período muestra las 3 fechas legales (abr, ago, dic)
- [ ] Checklist muestra estado PENDIENTE / ENTREGADA / NO_APLICA con badge de color
- [ ] Selector de ítem/talla se puebla desde `availableItemsForDotacion` (no texto libre)
- [ ] Stock visible en el selector de ítem y talla
- [ ] No se puede ingresar quantity > stock disponible del ítem/talla seleccionado
- [ ] Error claro si el backend rechaza por stock insuficiente (no cierra el modal)
- [ ] Uploader de comprobante funcional (PDF/JPG/PNG, máx 5MB)
- [ ] "Generar período" requiere confirmación antes de ejecutar
- [ ] Botón "Exportar reporte" descarga archivo correctamente
- [ ] Historial de dotaciones visible en perfil del empleado (OS-531)
- [ ] Paginación cursor-based en todos los listados
- [ ] Estados loading / error / empty en todos los componentes con datos async
- [ ] Estilos con CSS Modules — sin inline styles
- [ ] `pnpm typecheck` en verde
