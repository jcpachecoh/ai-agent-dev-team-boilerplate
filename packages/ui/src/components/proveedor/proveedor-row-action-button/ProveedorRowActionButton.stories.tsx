import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorRowActionButton } from './ProveedorRowActionButton';

const meta: Meta<typeof ProveedorRowActionButton> = {
  title: 'Proveedor/ProveedorRowActionButton',
  component: ProveedorRowActionButton,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { theme: 'dark', size: 'sm' },
};
export default meta;
type Story = StoryObj<typeof ProveedorRowActionButton>;

export const View: Story = { args: { variant: 'view' } };
export const Report: Story = { args: { variant: 'report' } };
export const Pdf: Story = { args: { variant: 'pdf' } };

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <ProveedorRowActionButton {...args} variant="view" />
      <ProveedorRowActionButton {...args} variant="report" />
      <ProveedorRowActionButton {...args} variant="pdf" />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark', variant: 'view' },
};
