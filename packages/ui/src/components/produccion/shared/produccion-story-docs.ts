import type { Meta } from '@storybook/react';

export const PRODUCCION_FIGMA_BASE = 'https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk';

export function produccionFigmaLink(nodeId: string): string {
  return `${PRODUCCION_FIGMA_BASE}?node-id=${nodeId.replace(':', '-')}&m=dev`;
}

export function produccionComponentDocs(
  description: string,
  figmaNodeId?: string,
): NonNullable<Meta['parameters']> {
  const figmaBlock = figmaNodeId
    ? `\n\n**Figma (dev mode):** [node ${figmaNodeId}](${produccionFigmaLink(figmaNodeId)})`
    : '';
  return { docs: { description: { component: `${description}${figmaBlock}` } } };
}

export const PRODUCCION_COMPONENT_DOCS = {
  plantShell:
    'Shell superior oscuro para pantallas de planta: marca, contexto, alarmas, estado en vivo y fecha/hora.',
  moduleTabs: 'Tabs principales entre Mapa de planta y Configuración de maestros.',
  subTabs: 'Tabs internas para Estaciones y Recetas de producción.',
  kpiCell: 'Celda KPI compacta de planta para métricas operativas.',
  filterChipGroup: 'Grupo horizontal de filtros tipo chip con estado activo dorado.',
  primaryAction: 'Botón primario dorado para acciones como Nueva estación o Nueva receta.',
  statusBadge: 'Badge de estado para estaciones y recetas.',
  typeBadge: 'Badge de tipo de estación con tonos por área productiva.',
  stationHeader: 'Cabecera de tabla de estaciones de producción.',
  stationRow: 'Fila seleccionable de estación de producción.',
  stationPanel: 'Panel lateral de detalle de estación y recetas/fases asignadas.',
  recipeHeader: 'Cabecera de tabla de recetas de producción.',
  recipeRow: 'Fila seleccionable de receta de producción.',
  recipePanel: 'Panel lateral de receta seleccionada con métricas, acciones y fases.',
  phaseItem: 'Item ordenado de fase con estación, tiempo, operadores y QA.',
  plantMap: 'Layout del mapa de planta con tarjetas de estación, cola OP y actividad.',
  plantStationCard: 'Tarjeta de estación en el mapa de planta.',
  orderQueueRow: 'Fila compacta de orden de producción en cola.',
  operatorActivityRow: 'Fila de actividad reciente por operario y estación.',
  overviewPreview: 'Composición de Mapa de planta según Figma.',
  stationsPreview: 'Composición de Maestros - Estaciones según Figma.',
  recipesPreview: 'Composición de Maestros - Recetas según Figma.',
} as const;
