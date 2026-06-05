# WEB-PROD-03 — Descargar PDF de Orden de Producción

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PRODUCCION]` `[MES]`  
**Assigned Agent:** frontend-developer  
**Status:** `done`  
**Depends On:** `tasks/mes-plant/MES-09-op-document-pdf/04-pdf-generation-endpoint.md`  
**Route base:** `/produccion/ordenes/:orderId`

---

## Objetivo

Agregar acción **Descargar PDF** en el detalle (y opcionalmente en el listado) de órdenes de producción del supervisor web. El PDF debe generarse en backend (`GET /api/plant/orders/:id/pdf`) y descargarse en el navegador con el mismo layout que el formulario físico **ORDEN DE PRODUCCIÓN**.

---

## Alcance

- Botón/acción en `ProductionOrderDetailView` (header o barra de acciones junto a Planificar / Pausar / etc.).
- Opcional: icono PDF en fila del listado (`ProductionOrdersListView`) usando patrón `RecetaUtilityButton variant="pdf"`.
- Cliente API: `downloadProductionOrderPdf(orderId)` → blob + nombre de archivo.
- Hook `useDownloadProductionOrderPdf` con estado loading/error.
- Toast de error si falla la descarga.

---

## Fuera de alcance

- Generación PDF en cliente (jsPDF, etc.).
- Edición de campos del documento en UI (ticket aparte si se necesita formulario digital).
- Cambios en `apps/plant` (tablet operario).

---

## API

```typescript
// apps/web-app/src/features/produccion/api/produccion.api.ts

export async function downloadProductionOrderPdf(orderId: string): Promise<void> {
  const response = await mesPlantFetch(`/orders/${orderId}/pdf`, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });
  if (!response.ok) throw new Error('No se pudo generar el PDF');
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const filename = parseFilenameFromContentDisposition(disposition) ?? `OP-${orderId}.pdf`;
  triggerBrowserDownload(blob, filename);
}
```

Reutilizar helper de descarga si existe en inventario/proveedores; si no, añadir util mínima en `features/produccion/utils/download.ts`.

---

## UI

### Detalle (`ProductionOrderDetailView.tsx`)

- Acción secundaria: **Descargar PDF** (icono `Download` de Lucide, igual que recetas).
- Visible para órdenes en cualquier estado excepto `DRAFT` vacío sin planificar — **recomendación:** mostrar siempre; PDF en borrador muestra materiales vacíos hasta planificar.
- Deshabilitar botón mientras `isPending`.

### Listado (opcional)

- Columna acciones o menú contextual con PDF; `stopPropagation` en click para no navegar al detalle.

### Componente UI

Preferir `RecetaUtilityButton` con `variant="pdf"` o `Button` outline con icono — consistente con pantalla de recetas.

---

## Tipos / hooks

```typescript
// useDownloadProductionOrderPdf.ts
export function useDownloadProductionOrderPdf() {
  return useMutation({
    mutationFn: (orderId: string) => downloadProductionOrderPdf(orderId),
  });
}
```

---

## Criterios de aceptación

- [x] Click en Descargar PDF abre/guarda archivo `OP-{número}.pdf`.
- [x] PDF contiene logo, tablas de materiales, rutas, calidad y coproductos (validación manual con OP planificada).
- [x] Error de red muestra toast en español.
- [x] Tests: mock fetch blob en `produccion.api.test.ts`; test de botón en `ProductionOrderDetailView` (click llama mutation).

---

## Archivos esperados

| Archivo                                                                       | Cambio                       |
| ----------------------------------------------------------------------------- | ---------------------------- |
| `features/produccion/api/produccion.api.ts`                                   | `downloadProductionOrderPdf` |
| `features/produccion/api/produccion.api.test.ts`                              | test descarga                |
| `features/produccion/hooks/useDownloadProductionOrderPdf.ts`                  | nuevo                        |
| `features/produccion/ProductionOrderDetailView/ProductionOrderDetailView.tsx` | botón                        |
| `features/produccion/ProductionOrdersListView/ProductionOrdersListView.tsx`   | opcional PDF en fila         |
