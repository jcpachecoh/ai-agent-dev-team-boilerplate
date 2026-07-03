import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorCatalogTableHeader } from './ProveedorCatalogTableHeader';

const meta: Meta<typeof ProveedorCatalogTableHeader> = {
  title: 'Proveedor/ProveedorCatalogTableHeader',
  component: ProveedorCatalogTableHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl' },
};
export default meta;
type Story = StoryObj<typeof ProveedorCatalogTableHeader>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorCatalogTableHeader {...args} size="sm" />
      <ProveedorCatalogTableHeader {...args} size="md" />
      <ProveedorCatalogTableHeader {...args} size="xl" />
    </div>
  ),
};
