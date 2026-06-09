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
import { InventarioPagination } from './InventarioPagination';

const meta: Meta<typeof InventarioPagination> = {
  title: 'Inventario/InventarioPagination',
  component: InventarioPagination,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.pagination, '2075:1140'),
};

export default meta;
type Story = StoryObj<typeof InventarioPagination>;

export const Default: Story = { args: { page: 1, totalPages: 10 } };
export const MiddlePage: Story = { args: { page: 5, totalPages: 10 } };
export const LastPage: Story = { args: { page: 10, totalPages: 10 } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InventarioPagination {...args} size="sm" />
      <InventarioPagination {...args} size="md" />
      <InventarioPagination {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
