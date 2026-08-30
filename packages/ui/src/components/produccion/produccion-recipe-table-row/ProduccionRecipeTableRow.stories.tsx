import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionRecipeTableRow } from './ProduccionRecipeTableRow';
const meta: Meta<typeof ProduccionRecipeTableRow> = {
  title: 'Produccion/ProduccionRecipeTableRow',
  component: ProduccionRecipeTableRow,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.recipeRow, '2096:1947'),
};
export default meta;
type Story = StoryObj<typeof ProduccionRecipeTableRow>;
export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Draft: Story = {
  args: {
    name: 'Papas fritas temporada',
    category: 'Acompañamientos',
    productName: 'Papas temporada 200g',
    batchSizeLabel: '40 kg',
    phaseCount: 3,
    totalTimeLabel: '33 min',
    versionLabel: 'v1.0',
    status: 'draft',
  },
};
