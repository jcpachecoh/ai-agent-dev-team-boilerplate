import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionModuleTabs } from './ProduccionModuleTabs';
const meta: Meta<typeof ProduccionModuleTabs> = {
  title: 'Produccion/ProduccionModuleTabs',
  component: ProduccionModuleTabs,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.moduleTabs, '2096:153'),
};
export default meta;
type Story = StoryObj<typeof ProduccionModuleTabs>;
export const Masters: Story = {
  args: {
    theme: 'light',
  },
};
export const MapActive: Story = {
  args: {
    activeId: 'map',
    theme: 'light',
  },
};
