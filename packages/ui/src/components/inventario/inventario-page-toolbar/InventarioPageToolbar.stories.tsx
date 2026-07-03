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
import { InventarioPageToolbar } from './InventarioPageToolbar';

const meta: Meta<typeof InventarioPageToolbar> = {
  title: 'Inventario/InventarioPageToolbar',
  component: InventarioPageToolbar,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.pageToolbar, '2075:1018'),
};

export default meta;
type Story = StoryObj<typeof InventarioPageToolbar>;

export const Products: Story = {};
export const Movements: Story = {
  args: {
    title: 'Movimientos de Stock',
    subtitle: 'Historial de entradas, salidas y ajustes',
    actionLabel: 'EXPORTAR',
  },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Products.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InventarioPageToolbar {...args} size="sm" />
      <InventarioPageToolbar {...args} size="md" />
      <InventarioPageToolbar {...args} size="xl" />
    </div>
  ),
  args: Products.args,
};
