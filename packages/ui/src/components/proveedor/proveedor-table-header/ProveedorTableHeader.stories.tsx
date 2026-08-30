import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorTableHeader } from './ProveedorTableHeader';

const meta: Meta<typeof ProveedorTableHeader> = {
  title: 'Proveedor/ProveedorTableHeader',
  component: ProveedorTableHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl' },
};

export default meta;
type Story = StoryObj<typeof ProveedorTableHeader>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorTableHeader {...args} size="sm" />
      <ProveedorTableHeader {...args} size="md" />
      <ProveedorTableHeader {...args} size="xl" />
    </div>
  ),
};
