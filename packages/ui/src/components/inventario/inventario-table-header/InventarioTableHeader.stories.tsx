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
import { InventarioTableHeader } from './InventarioTableHeader';

const meta: Meta<typeof InventarioTableHeader> = {
  title: 'Inventario/InventarioTableHeader',
  component: InventarioTableHeader,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.tableHeader, '2075:1050'),
  argTypes: { variant: { control: 'radio', options: ['product', 'movement', 'alert'] } },
};

export default meta;
type Story = StoryObj<typeof InventarioTableHeader>;

export const Products: Story = { args: { variant: 'product', size: 'xl' } };
export const Movements: Story = { args: { variant: 'movement', size: 'xl' } };
export const Alerts: Story = { args: { variant: 'alert', size: 'xl' } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Products.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Products.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <InventarioTableHeader {...args} size="sm" />
      <InventarioTableHeader {...args} size="md" />
      <InventarioTableHeader {...args} size="xl" />
    </div>
  ),
  args: Products.args,
};
