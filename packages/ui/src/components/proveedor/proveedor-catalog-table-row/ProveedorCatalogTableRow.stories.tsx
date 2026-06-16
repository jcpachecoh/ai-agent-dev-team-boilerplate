import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorCatalogTableRow } from './ProveedorCatalogTableRow';

const meta: Meta<typeof ProveedorCatalogTableRow> = {
  title: 'Proveedor/ProveedorCatalogTableRow',
  component: ProveedorCatalogTableRow,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl' },
};
export default meta;
type Story = StoryObj<typeof ProveedorCatalogTableRow>;

export const Available: Story = {};
export const Limited: Story = {
  args: {
    productName: 'Lomo de Cerdo',
    sku: 'LCP-004',
    status: 'limited',
    currentPrice: '$22.000',
    priceTrend: 'up',
  },
};
export const PriceDown: Story = {
  args: {
    productName: 'Costilla de Cerdo',
    sku: 'CCP-003',
    currentPrice: '$18.900',
    priceTrend: 'down',
  },
};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProveedorCatalogTableRow {...args} size="sm" />
      <ProveedorCatalogTableRow {...args} size="md" />
      <ProveedorCatalogTableRow {...args} size="xl" />
    </div>
  ),
};
