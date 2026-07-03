import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorActionButton } from './ProveedorActionButton';

const meta: Meta<typeof ProveedorActionButton> = {
  title: 'Proveedor/ProveedorActionButton',
  component: ProveedorActionButton,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorActionButton>;

export const NewSupplier: Story = { args: { variant: 'primary' } };
export const Export: Story = { args: { variant: 'export' } };
export const NewProduct: Story = { args: { variant: 'new-product' } };
export const Disabled: Story = { args: { variant: 'primary', disabled: true } };
export const Loading: Story = { args: { variant: 'primary', loading: true } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { ...NewSupplier.args, theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      <ProveedorActionButton {...args} size="sm" />
      <ProveedorActionButton {...args} size="md" />
      <ProveedorActionButton {...args} size="xl" />
    </div>
  ),
  args: NewSupplier.args,
};
