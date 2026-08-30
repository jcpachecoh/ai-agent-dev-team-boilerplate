import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorFormHeader } from './ProveedorFormHeader';

const meta: Meta<typeof ProveedorFormHeader> = {
  title: 'Proveedor/ProveedorFormHeader',
  component: ProveedorFormHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorFormHeader>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorFormHeader {...args} size="sm" />
      <ProveedorFormHeader {...args} size="md" />
      <ProveedorFormHeader {...args} size="xl" />
    </div>
  ),
};
