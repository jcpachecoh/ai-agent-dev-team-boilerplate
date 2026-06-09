import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPlantStationCard } from './ProduccionPlantStationCard';
const meta: Meta<typeof ProduccionPlantStationCard> = {
  title: 'Produccion/ProduccionPlantStationCard',
  component: ProduccionPlantStationCard,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.plantStationCard),
};
export default meta;
type Story = StoryObj<typeof ProduccionPlantStationCard>;
export const Default: Story = {};
export const Maintenance: Story = {
  args: {
    code: 'EST-08',
    name: 'Lavado y Sanitización',
    status: 'maintenance',
    tone: 'sanitation',
    meta: 'Mantenimiento programado',
    progress: 28,
  },
};
