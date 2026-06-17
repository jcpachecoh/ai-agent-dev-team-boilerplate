import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorCatalogTable } from './ProveedorCatalogTable';

const sampleRows = [
  {
    productName: 'Lomo de Res Premium',
    sku: 'LRP-001',
    currentPrice: '$28.500',
    priceTrend: 'up' as const,
  },
  {
    productName: 'Pechuga de Pollo',
    sku: 'PCP-002',
    currentPrice: '$12.500',
    priceTrend: 'neutral' as const,
  },
  {
    productName: 'Costilla de Cerdo',
    sku: 'CCP-003',
    currentPrice: '$18.900',
    priceTrend: 'down' as const,
  },
];

const meta: Meta<typeof ProveedorCatalogTable> = {
  title: 'Proveedor/ProveedorCatalogTable',
  component: ProveedorCatalogTable,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl', rows: sampleRows },
};
export default meta;
type Story = StoryObj<typeof ProveedorCatalogTable>;

export const Default: Story = {};
export const ManyRows: Story = {
  args: {
    rows: [...sampleRows, ...sampleRows.map((row, i) => ({ ...row, sku: `${row.sku}-${i}` }))],
  },
};
export const Empty: Story = { args: { rows: [] } };
export const FullWidthXL: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProveedorCatalogTable {...args} size="sm" rows={sampleRows.slice(0, 1)} />
      <ProveedorCatalogTable {...args} size="md" rows={sampleRows.slice(0, 2)} />
      <ProveedorCatalogTable {...args} size="xl" rows={sampleRows} />
    </div>
  ),
};
