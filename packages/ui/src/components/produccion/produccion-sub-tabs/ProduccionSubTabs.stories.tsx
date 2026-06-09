import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionSubTabs } from './ProduccionSubTabs';
const meta: Meta<typeof ProduccionSubTabs> = {
  title: 'Produccion/ProduccionSubTabs',
  component: ProduccionSubTabs,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.subTabs, '2096:1402'),
};
export default meta;
type Story = StoryObj<typeof ProduccionSubTabs>;
export const Stations: Story = {};
export const Recipes: Story = { args: { activeId: 'recipes' } };
