import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorPageHeader } from './ProveedorPageHeader';

const meta: Meta<typeof ProveedorPageHeader> = {
  title: 'Proveedor/ProveedorPageHeader',
  component: ProveedorPageHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorPageHeader>;

export const Default: Story = {};
export const CustomTitle: Story = {
  args: { title: 'Proveedores', subtitle: 'Gestión de proveedores ' },
};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProveedorPageHeader {...args} size="sm" />
      <ProveedorPageHeader {...args} size="md" />
      <ProveedorPageHeader {...args} size="xl" />
    </div>
  ),
};
