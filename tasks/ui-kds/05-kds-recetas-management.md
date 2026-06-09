# UI-KDS-05: UI de Recetas de Produccion (Planta Palos de Lena)

**Domain:** `[UI-KDS]` `[PLANT]` `[RECETAS]` `[REACT-QUERY]` `[RESPONSIVE]`  
**Assigned Agent:** frontend-developer, ui-engineer  
**Status:** `pending`  
**Created:** 2026-05-27  
**Depends On:** `tasks/ui-kds/00-epic.md`, `tasks/packages-ui/06-receta-figma-components.md`

---

## Objetivo

Implementar en Plant una UI para crear y gestionar recetas de produccion, reutilizando los componentes de `@packages/ui/src/components/receta` y manteniendo el patron visual dark de KDS.

---

## Alcance de Pantallas

### Pantalla 1: Lista de Recetas

- Tabla con columnas: nombre receta, categoria (entrada, plato fuerte, postre), tiempo estimado, fases (cantidad), estado (activa/inactiva), acciones.
- Busqueda por nombre de receta.
- Filtros: categoria, estado.
- Boton: `+ Nueva Receta`.
- Click en fila: abre editor de receta.

### Pantalla 2: Editor de Receta (Crear/Editar)

#### Datos Generales

- Nombre receta (text)
- Categoria (select: entrada, plato fuerte, postre, bebida)
- Tiempo estimado total (minutes)
- Rendimiento (porciones, ej: 4 porciones)
- Descripcion (textarea)

#### Editor de Fases del Proceso

- Tabla dinamica con drag-drop para reordenar fases.
- Columnas: `#`, `Nombre Fase`, `Descripcion`, `Duracion (min)`, `Responsable (select operario/supervisor)`, `Ingredientes requeridos`, `Validacion (checklist)`.
- Boton `Agregar Fase`.

#### Modal Agregar Fase

- Nombre fase (ej: "Preparacion de ingredientes", "Coccion", "Empaque")
- Descripcion (paso a paso de que hacer)
- Duracion estimada (minutos)
- Responsable requerido (rol: operario, supervisor, manager)
- Ingredientes necesarios (select multi: buscar insumos)
- Cantidad por ingrediente
- Validaciones requeridas (checkboxes): "Temperatura correcta", "Punto de coccion", "Peso correcto", "Presentacion", etc.

#### Validaciones por Fase

Seccion de "Criterios de Aceptacion" para cada fase. Cada validacion puede tener:

- Tipo: booleano (OK/NO OK), numerico (temp >= 85C), visual (foto)
- Descripcion
- Valor esperado
- Tolerancia
- Responsable de validar

### Pantalla 3: Tabla de Control de Procesos

Vista de todas las recetas con resumen:

- Nombre receta
- Cantidad de fases
- Duracion total
- Estado del proceso (verde si todas fases OK, amarillo si en proceso, rojo si hay falla)
- Ultima validacion
- Boton: `Ver detalle` -> abre historial de ejecuciones

### Pantalla 4: Historial de Ejecuciones (Opcional)

Registro de cada vez que se ejecuto la receta:

- fecha
- operario
- fases completadas
- validaciones pasadas/fallidas
- notas
- duracion real

Filtros:

- fecha
- operario
- estado (OK/FALLO)

---

## Funcionalidades Transversales

- Guardado automatico.
- Preview en tiempo real de fases agregadas.
- Validacion:
  - nombre receta unica
  - min 1 fase
  - min 1 validacion por fase
- Exportar receta a PDF (incluya todas las fases y validaciones).
- Duplicar receta.
- Activar/desactivar receta.
- Historial de cambios (quien edito, cuando).

---

## Uso de Componentes Receta (`@packages/ui/src/components/receta`)

Reutilizar de forma prioritaria los componentes existentes del namespace receta (evitar crear UI duplicada en Plant si ya existe componente en `packages/ui`):

- `RecetaTableHeader`
- `RecetaMetricCard`
- `RecetaStatusButton`
- `RecetaFormButton`
- `RecetaStepCard`
- `RecetaTimelinePanel`
- `RecetaInfoPanel`
- `RecetaTextInput`

Si falta una pieza puntual, crearla primero en `packages/ui` con story y luego consumirla desde Plant.

---

## Implementacion Sugerida

### Rutas sugeridas

- `/recipes` -> Lista de recetas
- `/recipes/new` -> Crear receta
- `/recipes/:recipeId/edit` -> Editar receta
- `/recipes/process-control` -> Tabla de control de procesos
- `/recipes/executions` -> Historial de ejecuciones

### Estado y datos

- React Query para listas, detalle, create/update, acciones de estado y export.
- Query keys sugeridas:
  - `['recipes', filters]`
  - `['recipe', recipeId]`
  - `['recipe-process-control', filters]`
  - `['recipe-executions', filters]`
- Mutations con invalidacion selectiva de queries afectadas.

### Archivos probables

- `apps/plant/src/screens/RecipesListScreen/*`
- `apps/plant/src/screens/RecipeEditorScreen/*`
- `apps/plant/src/screens/RecipeProcessControlScreen/*`
- `apps/plant/src/screens/RecipeExecutionsScreen/*`
- `apps/plant/src/services/recipes.service.ts`
- `apps/plant/src/services/plant-api.service.ts` (si requiere extensiones)
- `apps/plant/src/routes/*` (o router equivalente)

---

## Acceptance Criteria (MANTENER IGUAL)

- [ ] Usuario crea nueva receta con nombre y categoria
- [ ] Editor permite agregar multiples fases en orden
- [ ] Cada fase puede tener ingredientes, duracion, validaciones
- [ ] Validaciones se guardan correctamente
- [ ] Tabla de control muestra estado de todas las recetas
- [ ] UI es responsivo (desktop + tablet)
- [ ] Formularios validan datos requeridos
- [ ] Busqueda y filtros funcionan
- [ ] Exportar a PDF genera documento profesional
- [ ] Tests unitarios > 80%

---

## Validacion

```bash
pnpm --filter @restopsiq/ui typecheck
pnpm --filter @restopsiq/ui storybook
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test
```
