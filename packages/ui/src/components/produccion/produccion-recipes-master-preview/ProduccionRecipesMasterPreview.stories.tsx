import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionScreenDecorator, produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionRecipesMasterPreview } from './ProduccionRecipesMasterPreview';
const meta: Meta<typeof ProduccionRecipesMasterPreview> = {
  title: 'Produccion/ProduccionRecipesMasterPreview',
  component: ProduccionRecipesMasterPreview,
  ...produccionStoryMeta,
  decorators: [produccionScreenDecorator],
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.recipesPreview, '2096:1828'),
};
export default meta;
type Story = StoryObj<typeof ProduccionRecipesMasterPreview>;
export const Default: Story = { args: { size: 'xl' } };
