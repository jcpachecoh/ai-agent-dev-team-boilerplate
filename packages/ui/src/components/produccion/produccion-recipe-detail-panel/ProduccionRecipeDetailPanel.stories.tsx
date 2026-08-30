import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionRecipeDetailPanel } from './ProduccionRecipeDetailPanel';
const meta: Meta<typeof ProduccionRecipeDetailPanel> = {
  title: 'Produccion/ProduccionRecipeDetailPanel',
  component: ProduccionRecipeDetailPanel,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.recipePanel),
};
export default meta;
type Story = StoryObj<typeof ProduccionRecipeDetailPanel>;
export const Default: Story = {};
