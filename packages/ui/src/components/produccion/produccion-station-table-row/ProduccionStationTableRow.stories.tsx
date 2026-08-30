import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionStationTableRow } from './ProduccionStationTableRow';
const meta: Meta<typeof ProduccionStationTableRow> = {
  title: 'Produccion/ProduccionStationTableRow',
  component: ProduccionStationTableRow,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.stationRow, '2096:1461'),
};
export default meta;
type Story = StoryObj<typeof ProduccionStationTableRow>;
export const Default: Story = {};
export const Selected: Story = {
  args: {
    code: 'EST-04',
    name: 'Línea Fría',
    location: 'Zona C - Refrigeración',
    type: 'Enfriamiento',
    typeTone: 'cooling',
    selected: true,
  },
};
export const Maintenance: Story = {
  args: {
    code: 'EST-08',
    name: 'Lavado y Sanitización',
    type: 'Sanitización',
    typeTone: 'sanitation',
    status: 'maintenance',
    recipeCountLabel: '—',
  },
};
