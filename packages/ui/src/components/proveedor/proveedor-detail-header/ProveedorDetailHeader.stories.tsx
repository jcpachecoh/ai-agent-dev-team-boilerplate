import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorDetailHeader } from './ProveedorDetailHeader';

const meta: Meta<typeof ProveedorDetailHeader> = {
  title: 'Proveedor/ProveedorDetailHeader',
  component: ProveedorDetailHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorDetailHeader>;

export const Default: Story = {};
export const Inactive: Story = { args: { status: 'inactive' } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorDetailHeader {...args} size="sm" />
      <ProveedorDetailHeader {...args} size="md" />
      <ProveedorDetailHeader {...args} size="xl" />
    </div>
  ),
};
