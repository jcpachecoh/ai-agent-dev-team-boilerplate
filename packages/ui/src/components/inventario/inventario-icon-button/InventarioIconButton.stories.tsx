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
import { InventarioIconButton } from './InventarioIconButton';

const meta: Meta<typeof InventarioIconButton> = {
  title: 'Inventario/InventarioIconButton',
  component: InventarioIconButton,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.iconButton, '2075:1062'),
  argTypes: {
    variant: { control: 'select', options: ['edit', 'delete', 'view', 'order', 'resolve'] },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioIconButton>;

export const Edit: Story = { args: { variant: 'edit' } };

export const RowActions: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <InventarioIconButton {...args} variant="edit" />
      <InventarioIconButton {...args} variant="delete" />
    </div>
  ),
};

export const AlertActions: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <InventarioIconButton {...args} variant="order" />
      <InventarioIconButton {...args} variant="resolve" />
    </div>
  ),
};

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
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <InventarioIconButton {...args} variant="edit" />
      <InventarioIconButton {...args} variant="delete" />
    </div>
  ),
};
