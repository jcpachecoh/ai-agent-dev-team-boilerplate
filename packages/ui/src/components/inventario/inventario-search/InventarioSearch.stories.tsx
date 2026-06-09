import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioSearch } from './InventarioSearch';

const meta: Meta<typeof InventarioSearch> = {
  title: 'Inventario/InventarioSearch',
  component: InventarioSearch,
  ...inventarioStoryMeta,
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.search, '2075:1034'),
};

export default meta;
type Story = StoryObj<typeof InventarioSearch>;

export const Default: Story = { args: {} };

export const WithValue: Story = { args: { value: 'POLLO' } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InventarioSearch {...args} size="sm" />
      <InventarioSearch {...args} size="md" />
      <InventarioSearch {...args} size="xl" />
    </div>
  ),
};
