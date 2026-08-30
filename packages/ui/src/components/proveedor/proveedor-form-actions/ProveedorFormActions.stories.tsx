import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorFormActions } from './ProveedorFormActions';

const meta: Meta<typeof ProveedorFormActions> = {
  title: 'Proveedor/ProveedorFormActions',
  component: ProveedorFormActions,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorFormActions>;

export const Default: Story = {};
export const SaveLoading: Story = { args: { saveLoading: true } };
export const SaveDisabled: Story = { args: { saveDisabled: true } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
      <ProveedorFormActions {...args} size="sm" />
      <ProveedorFormActions {...args} size="md" />
      <ProveedorFormActions {...args} size="xl" />
    </div>
  ),
};
