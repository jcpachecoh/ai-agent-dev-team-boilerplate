import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorDetailHeader } from './ProveedorDetailHeader';

const meta: Meta<typeof ProveedorDetailHeader> = {
  title: 'Proveedor/ProveedorDetailHeader',
  component: ProveedorDetailHeader,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  argTypes: {
    ...proveedorStoryMeta.argTypes,
    nameFontSize: {
      control: 'text',
      description: 'Tamaño del título (ej. 1.25rem, 20px). Sobrescribe el preset de `size`.',
    },
    metaFontSize: {
      control: 'text',
      description: 'Tamaño de la línea SUP / NIT (ej. 0.75rem, 12px).',
    },
    actions: { control: false },
    onBack: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ProveedorDetailHeader>;

export const Default: Story = {};

export const Inactive: Story = { args: { status: 'inactive' } };

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark', size: 'xl' },
};

export const CustomNameFontSize: Story = {
  args: {
    size: 'xl',
    nameFontSize: '1.75rem',
    metaFontSize: '0.8125rem',
  },
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
