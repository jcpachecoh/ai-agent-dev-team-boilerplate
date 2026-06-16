import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorCatalogEditButton } from './ProveedorCatalogEditButton';

const meta: Meta<typeof ProveedorCatalogEditButton> = {
  title: 'Proveedor/ProveedorCatalogEditButton',
  component: ProveedorCatalogEditButton,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProveedorCatalogEditButton>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ProveedorCatalogEditButton {...args} size="sm" />
      <ProveedorCatalogEditButton {...args} size="md" />
      <ProveedorCatalogEditButton {...args} size="xl" />
    </div>
  ),
};
