import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorTableRow } from './ProveedorTableRow';

const meta: Meta<typeof ProveedorTableRow> = {
  title: 'Proveedor/ProveedorTableRow',
  component: ProveedorTableRow,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl' },
};

export default meta;
type Story = StoryObj<typeof ProveedorTableRow>;

export const Active: Story = {};
export const Inactive: Story = {
  args: {
    supplierId: 'SUP-004',
    name: 'Especias del Sur',
    status: 'inactive',
    reliability: '4.2 ★',
  },
};
export const Pending: Story = {
  args: {
    supplierId: 'SUP-006',
    name: 'Aceites Premium Colombia',
    status: 'pending',
    reliability: '-',
    productCount: 0,
    balance: '$0',
    lastPurchaseOrder: '-',
  },
};
export const Selected: Story = { args: { selected: true } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProveedorTableRow {...args} size="sm" />
      <ProveedorTableRow {...args} size="md" />
      <ProveedorTableRow {...args} size="xl" />
    </div>
  ),
};
