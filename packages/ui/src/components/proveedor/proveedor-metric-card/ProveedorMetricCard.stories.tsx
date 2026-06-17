import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorMetricCard } from './ProveedorMetricCard';

const meta: Meta<typeof ProveedorMetricCard> = {
  title: 'Proveedor/ProveedorMetricCard',
  component: ProveedorMetricCard,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorMetricCard>;

export const ActiveSuppliers: Story = {
  args: { label: 'PROVEEDORES ACTIVOS', value: 6, valueColor: 'success' },
};
export const PendingApproval: Story = {
  args: { label: 'PENDIENTES APROBACIÓN', value: 1, valueColor: 'warning' },
};
export const AccountsPayableBalance: Story = {
  args: {
    label: 'SALDO CUENTAS POR PAGAR',
    value: '$8.25M',
    valueFormat: 'currency',
    valueColor: 'warning',
  },
};
export const ProductTotals: Story = {
  args: { label: 'PRODUCTOS TOTALES', value: 424, valueColor: 'default' },
};
export const CustomValueColor: Story = {
  args: { label: 'CUSTOM', value: 99, valueColor: '#ff6b6b' },
};
export const Loading: Story = { args: { loading: true } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { ...ActiveSuppliers.args, theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorMetricCard {...args} size="sm" />
      <ProveedorMetricCard {...args} size="md" />
      <ProveedorMetricCard {...args} size="xl" />
    </div>
  ),
  args: ActiveSuppliers.args,
};
