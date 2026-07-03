import type { Meta } from '@storybook/react';

/** Opssynk — inventario dashboard and related nodes. */
export const INVENTARIO_FIGMA_BASE = 'https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk';

export function inventarioFigmaLink(nodeId: string): string {
  return `${INVENTARIO_FIGMA_BASE}?node-id=${nodeId.replace(':', '-')}&m=dev`;
}

export function inventarioComponentDocs(
  description: string,
  figmaNodeId?: string,
): NonNullable<Meta['parameters']> {
  const figmaBlock = figmaNodeId
    ? `\n\n**Figma (dev mode):** [node ${figmaNodeId}](${inventarioFigmaLink(figmaNodeId)})`
    : '';

  return {
    docs: {
      description: {
        component: `${description}${figmaBlock}`,
      },
    },
  };
}

export const INVENTARIO_COMPONENT_DOCS = {
  contextBadge:
    'Pill de contexto operativo: planta activa (punto de estado) o turno actual. Usado en la barra superior del dashboard.',
  topBar:
    'Barra superior del módulo Inventario: badges de contexto, búsqueda global, fecha/hora, notificaciones y acceso al usuario.',
  pageHeader:
    'Encabezado de página con título principal y subtítulo descriptivo del dashboard de inventario.',
  metricCard:
    'Tarjeta de métrica KPI con borde de acento izquierdo, etiqueta en mayúsculas, icono opcional y valor destacado.',
  panel:
    'Panel contenedor con título de sección y borde. Agrupa listas de barras, gráficos u otro contenido del dashboard.',
  barRow:
    'Fila de datos con etiqueta, valor numérico o porcentaje y barra de progreso horizontal. Soporta colores semánticos por nivel de stock.',
  barChart:
    'Gráfico de barras verticales con gradiente para histórico de ocupación u otras series temporales.',
  dashboardPreview:
    'Composición de referencia que ensambla todos los componentes del Dashboard de Inventario según el diseño Figma.',
  search: 'Campo de búsqueda con icono para listados y filtros de inventario.',
  select: 'Select nativo estilizado con chevron para filtros de categoría y proveedor.',
  primaryButton: 'Botón de acción principal (crear, exportar, generar) con variantes semánticas.',
  iconButton:
    'Botón compacto con icono para acciones de fila (editar, eliminar, ordenar, resolver).',
  tableHeader: 'Cabecera de tabla con columnas configurables y grid responsive.',
  tableRow: 'Fila de tabla para productos, movimientos o alertas de stock.',
  statusBadge: 'Badge de estado para tipo de movimiento o severidad de alerta.',
  pagination: 'Pie de tabla con resumen de página y navegación anterior/siguiente.',
  formField: 'Campo de formulario con etiqueta en mayúsculas para modales y filtros.',
  modal: 'Contenedor modal con cabecera, cuerpo y pie de acciones.',
  distributionBar: 'Barra de distribución por categoría para reportes.',
  summaryStat: 'Tarjeta compacta de resumen numérico para reportes.',
  filterToolbar: 'Barra de filtros con búsqueda y slots para dropdowns.',
  pageToolbar: 'Encabezado de página con título, subtítulo y slot de acción.',
  productsPreview: 'Pantalla Gestión de Productos (2075:1016).',
  productModalPreview: 'Modal Editar Producto sobre listado de productos (2075:1463).',
  movementsPreview: 'Pantalla Movimientos de Stock (2075:1662).',
  alertsPreview: 'Pantalla Alertas de Stock Bajo (2075:1910).',
  reportsPreview: 'Pantalla Reportes de Inventario (2075:2185).',
  reportFilterBar:
    'Barra horizontal de filtros de reporte: tipo, fechas y botón generar dentro de un panel.',
  reportDataTable: 'Tabla de datos del reporte con categoría, cantidad y porcentaje.',
  exportActions: 'Acciones de exportación CSV y PDF alineadas a la derecha.',
} as const;
