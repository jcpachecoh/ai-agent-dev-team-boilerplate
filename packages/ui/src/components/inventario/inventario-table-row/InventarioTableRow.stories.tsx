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
import { InventarioTableRow } from './InventarioTableRow';

const meta: Meta<typeof InventarioTableRow> = {
  title: 'Inventario/InventarioTableRow',
  component: InventarioTableRow,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.tableRow, '2075:1062'),
};

export default meta;
type Story = StoryObj<typeof InventarioTableRow>;

export const Product: Story = { args: { variant: 'product', size: 'xl' } };
export const ProductLowStock: Story = {
  args: { variant: 'product', lowStockWarning: true, stockTone: 'warning', stockTotal: 18 },
};
export const Movement: Story = {
  args: { variant: 'movement', movementType: 'entrada', size: 'xl' },
};
export const Alert: Story = { args: { variant: 'alert', severity: 'critical', size: 'xl' } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Product.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Product.args,
};
