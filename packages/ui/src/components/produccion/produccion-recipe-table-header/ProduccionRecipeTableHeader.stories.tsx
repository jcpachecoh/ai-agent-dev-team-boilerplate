import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionRecipeTableHeader } from './ProduccionRecipeTableHeader';
const meta: Meta<typeof ProduccionRecipeTableHeader> = {
  title: 'Produccion/ProduccionRecipeTableHeader',
  component: ProduccionRecipeTableHeader,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.recipeHeader, '2096:1930'),
};
export default meta;
type Story = StoryObj<typeof ProduccionRecipeTableHeader>;
export const Default: Story = {
  args: {
    theme: 'light',
    size: 'xl',
  },
};
