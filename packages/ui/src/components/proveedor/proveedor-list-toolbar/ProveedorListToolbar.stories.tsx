import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorListToolbar } from './ProveedorListToolbar';

const meta: Meta<typeof ProveedorListToolbar> = {
  title: 'Proveedor/ProveedorListToolbar',
  component: ProveedorListToolbar,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorListToolbar>;

export const Default: Story = {};
export const WithValue: Story = { args: { searchValue: 'Carnes' } };
export const FullWidthXL: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: { size: 'xl' },
};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProveedorListToolbar {...args} size="sm" />
      <ProveedorListToolbar {...args} size="md" />
      <ProveedorListToolbar {...args} size="xl" />
    </div>
  ),
};
