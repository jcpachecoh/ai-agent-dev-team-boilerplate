import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorStatusBadge } from './ProveedorStatusBadge';

const meta: Meta<typeof ProveedorStatusBadge> = {
  title: 'Proveedor/ProveedorStatusBadge',
  component: ProveedorStatusBadge,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorStatusBadge>;

export const SupplierActive: Story = { args: { domain: 'supplier', status: 'active' } };
export const SupplierInactive: Story = { args: { domain: 'supplier', status: 'inactive' } };
export const SupplierPending: Story = { args: { domain: 'supplier', status: 'pending' } };
export const CatalogAvailable: Story = { args: { domain: 'catalog', status: 'available' } };
export const CatalogLimited: Story = { args: { domain: 'catalog', status: 'limited' } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { ...SupplierActive.args, theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <ProveedorStatusBadge {...args} size="sm" />
      <ProveedorStatusBadge {...args} size="md" />
      <ProveedorStatusBadge {...args} size="xl" />
    </div>
  ),
  args: SupplierActive.args,
};
