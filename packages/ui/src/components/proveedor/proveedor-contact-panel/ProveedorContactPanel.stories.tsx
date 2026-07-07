import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorContactPanel } from './ProveedorContactPanel';

const meta: Meta<typeof ProveedorContactPanel> = {
  title: 'Proveedor/ProveedorContactPanel',
  component: ProveedorContactPanel,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProveedorContactPanel>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 584 }}>
      <ProveedorContactPanel {...args} size="sm" />
      <ProveedorContactPanel {...args} size="md" />
      <ProveedorContactPanel {...args} size="xl" />
    </div>
  ),
};
