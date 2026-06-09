import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPhaseListItem } from './ProduccionPhaseListItem';
const meta: Meta<typeof ProduccionPhaseListItem> = {
  title: 'Produccion/ProduccionPhaseListItem',
  component: ProduccionPhaseListItem,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.phaseItem, '2096:759'),
};
export default meta;
type Story = StoryObj<typeof ProduccionPhaseListItem>;
export const Default: Story = {
  args: {
    theme: 'light',
  },
};
export const RequiresQA: Story = {
  args: {
    order: 3,
    name: 'Asado lento',
    stationLabel: 'EST-03 Parrilla Central',
    durationLabel: '1h 30min',
    operatorsLabel: '1–1 op.',
    requiresQA: true,
  },
};
