# WEB-PROD-04 — UI Maestros de Planta

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PRODUCCION]` `[MES]` `[MAESTROS]`  
**Assigned Agent:** frontend-developer, ui-engineer  
**Status:** `todo`  
**Depends On:** `tasks/mes-plant/MES-02/00-epic-and-acceptance.md`  
**Access:** solo usuarios con rol `SUPERVISOR` u `OWNER`

---

## Objetivo

Crear la UI para que el supervisor configure los maestros operativos de la planta: **estaciones de trabajo** y **recetas de producción** con sus fases, insumos y reglas de calidad.

La experiencia debe ser usable en escritorio y tablet, porque el supervisor puede preparar o ajustar maestros desde piso de planta.

---

## Rutas propuestas

| Ruta                                | Pantalla                       | Descripción                                    |
| ----------------------------------- | ------------------------------ | ---------------------------------------------- |
| `/produccion/estaciones`            | `ProductionStationsListView`   | Listado y creación/edición de estaciones       |
| `/produccion/estaciones/:stationId` | `ProductionStationDetailView`  | Detalle + recetas/fases asignadas              |
| `/produccion/recetas`               | `ProductionRecipesListView`    | Listado de recetas, clonar y navegar a detalle |
| `/produccion/recetas/nueva`         | `CreateProductionRecipeWizard` | Wizard de creación en 2 pasos                  |
| `/produccion/recetas/:recipeId`     | `ProductionRecipeDetailView`   | Detalle + editor de fases                      |

Aplicar guard de ruta y ocultar entradas de navegación para roles distintos de `SUPERVISOR` u `OWNER`. Si un usuario sin permiso entra por URL directa, mostrar pantalla de acceso denegado o redirigir según el patrón existente de la web app.

---

## Alcance

### Pantalla Estaciones

- Listado de estaciones con columnas:
  - Código
  - Nombre
  - Ubicación
  - Estado
- Acción principal: **Nueva estación**.
- Formulario de creación/edición con todos los campos expuestos por el contrato de API de estaciones.
- Detalle o panel expandible para ver qué **recetas/fases** están asignadas a cada estación.
- Estados UI: loading, empty, error, saving y toast de éxito/error.

### Pantalla Recetas de Producción

- Listado de recetas con columnas:
  - Nombre
  - Producto terminado
  - Tamaño de lote
  - Tiempo estándar
  - Versión
- Acciones:
  - **Nueva receta**
  - **Clonar**
  - **Ver detalle**
- El listado debe permitir distinguir recetas activas, borradores y versiones anteriores si el API expone estado/versionado.

### Wizard Nueva Receta

Implementar creación en 2 pasos:

1. **Datos generales de la receta**
   - Nombre
   - Producto terminado
   - Tamaño de lote
   - Unidad de lote
   - Versión inicial o etiqueta de versión, si aplica
   - Campos adicionales del contrato API
2. **Fases**
   - Agregar fases
   - Reordenar fases con drag and drop
   - Validar que la receta tenga al menos una fase antes de crear/publicar

Guardar como borrador si el backend soporta estados; si no, crear la receta completa al finalizar el wizard.

### Editor de Fases

Panel para agregar, editar y reordenar fases dentro del detalle de receta y del wizard.

Por cada fase:

- Nombre
- Estación asignada (dropdown de estaciones)
- Tiempo estándar
- Mínimo de operarios
- Máximo de operarios
- Descripción
- Toggle `requiresQA`

Sección de insumos por fase:

- Agregar insumo desde catálogo
- Cantidad por lote
- Unidad
- Eliminar o editar insumo antes de guardar

Mostrar un **preview del tiempo total de la receta** actualizado en tiempo real al cambiar, agregar, eliminar o reordenar fases.

### Preview Operario

Antes de publicar una receta, permitir previsualizar cómo verá el operario cada fase:

- Orden de fases
- Nombre y descripción
- Estación asignada
- Tiempo estándar
- Operarios requeridos
- Insumos de la fase
- Indicador de QA cuando `requiresQA=true`

---

## Integración API

Reutilizar contratos del módulo MES Plant cuando estén disponibles:

- Estaciones: `WorkStation`
- Recetas: `ProductionRecipe`
- Fases: `ProductionPhase`
- Insumos por fase: `ProductionPhaseInput`

Referencias backend:

- `tasks/mes-plant/MES-02/01-interfaces.md`
- `tasks/mes-plant/MES-02/06-dtos-validation.md`
- `apps/api/src/mes/plant/controller/dto/create-workstation.dto.ts`
- `apps/api/src/mes/plant/controller/dto/create-recipe.dto.ts`

Frontend esperado:

- Cliente API bajo `apps/web-app/src/features/produccion/api/`
- Hooks React Query para listas, detalle y mutaciones
- Invalidación de cache tras crear/editar/clonar/reordenar
- Tipos FE alineados al DTO de respuesta del API, sin duplicar modelos mock si ya existen

---

## Componentes / UX

- Reutilizar el sistema visual actual de Producción e Inventario (`@restopsiq/ui`) antes de crear componentes nuevos.
- Usar patrón de tabla + toolbar + filtros ya presente en órdenes/comités de producción.
- El drag and drop debe soportar mouse y touch. Preferir una librería o implementación que use Pointer Events y sea accesible en tablet.
- El preview del tiempo total debe ser derivado del estado local de fases, no esperar al guardado en backend.
- Mantener formularios responsivos para tablet: campos en una columna cuando el ancho sea reducido y acciones visibles sin scroll horizontal.

---

## Fuera de alcance

- Cambios de schema Prisma o endpoints backend nuevos.
- App tablet del operario (`apps/plant`) excepto validar la forma visual del preview.
- Publicación automática de recetas si el backend todavía no expone flujo de publish.
- Gestión avanzada de versionado si el backend solo soporta `version` simple.

---

## Criterios de aceptación

- [ ] Solo usuarios con rol `SUPERVISOR` u `OWNER` pueden acceder a las rutas de maestros de planta.
- [ ] Pantalla Estaciones muestra código, nombre, ubicación y estado.
- [ ] Se puede crear/editar una estación con todos los campos del contrato API.
- [ ] En cada estación se ve qué recetas/fases están asignadas.
- [ ] Pantalla Recetas muestra nombre, producto terminado, tamaño de lote, tiempo estándar y versión.
- [ ] Se puede crear una receta desde wizard de 2 pasos.
- [ ] Se puede clonar una receta existente y editarla antes de guardar/publicar.
- [ ] El editor permite agregar, editar y reordenar fases.
- [ ] Drag and drop de fases funciona en pantalla táctil (tablet del supervisor).
- [ ] Cada fase permite configurar estación, tiempo estándar, min/max operarios, descripción y `requiresQA`.
- [ ] Cada fase permite agregar insumos del catálogo con cantidad y unidad.
- [ ] El tiempo total se recalcula al cambiar tiempos estándar de cualquier fase.
- [ ] Se puede previsualizar cómo verá el operario cada fase antes de publicar.
- [ ] Errores de API se muestran con toast o estado inline en español.
- [ ] Tests cubren guard de acceso, recálculo de tiempo total y reordenamiento de fases.

---

## Archivos esperados

| Archivo / carpeta                                                          | Cambio esperado                       |
| -------------------------------------------------------------------------- | ------------------------------------- |
| `apps/web-app/src/features/produccion/api/`                                | clientes y query keys para maestros   |
| `apps/web-app/src/features/produccion/hooks/`                              | hooks React Query                     |
| `apps/web-app/src/features/produccion/types.ts`                            | tipos de estaciones, recetas y fases  |
| `apps/web-app/src/features/produccion/ProductionStationsListView/`         | nueva pantalla                        |
| `apps/web-app/src/features/produccion/ProductionStationDetailView/`        | nueva pantalla                        |
| `apps/web-app/src/features/produccion/ProductionRecipesListView/`          | nueva pantalla                        |
| `apps/web-app/src/features/produccion/ProductionRecipeDetailView/`         | nueva pantalla + editor de fases      |
| `apps/web-app/src/features/produccion/components/RecipePhaseEditor.tsx`    | editor de fases reutilizable          |
| `apps/web-app/src/features/produccion/components/OperatorPhasePreview.tsx` | preview de fase como la verá operario |
| `apps/web-app/src/features/produccion/produccion.module.scss`              | estilos responsivos                   |
| `apps/web-app/src/App.tsx` / rutas de producción                           | registrar rutas protegidas            |
| `apps/web-app/src/navigation.ts`                                           | entrada de navegación si aplica       |

---

## Validación sugerida

```bash
pnpm --filter @restopsiq/web-app typecheck
pnpm --filter @restopsiq/web-app test -- --run produccion
```
