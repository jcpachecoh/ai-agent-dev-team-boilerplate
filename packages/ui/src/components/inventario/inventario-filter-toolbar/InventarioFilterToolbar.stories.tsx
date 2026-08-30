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
import { InventarioFilterToolbar } from './InventarioFilterToolbar';

const meta: Meta<typeof InventarioFilterToolbar> = {
  title: 'Inventario/InventarioFilterToolbar',
  component: InventarioFilterToolbar,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.filterToolbar, '2075:1030'),
};

export default meta;
type Story = StoryObj<typeof InventarioFilterToolbar>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 1184 }}>
      <InventarioFilterToolbar {...args} size="xl" />
    </div>
  ),
};
export const LowStockChecked: Story = { args: { lowStockOnly: true } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InventarioFilterToolbar {...args} size="sm" />
      <InventarioFilterToolbar {...args} size="md" />
      <InventarioFilterToolbar {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
