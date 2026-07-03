import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorFilterButtonGroup } from './ProveedorFilterButtonGroup';

const options = [
  { id: 'all', label: 'TODAS' },
  { id: 'delivered', label: 'ENTREGADAS' },
  { id: 'pending', label: 'PENDIENTES' },
  { id: 'cancelled', label: 'CANCELADAS' },
];

const meta: Meta<typeof ProveedorFilterButtonGroup> = {
  title: 'Proveedor/ProveedorFilterButtonGroup',
  component: ProveedorFilterButtonGroup,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { options, activeId: 'all', theme: 'dark', size: 'md' },
};
export default meta;
type Story = StoryObj<typeof ProveedorFilterButtonGroup>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [activeId, setActiveId] = useState(args.activeId ?? 'all');
    return <ProveedorFilterButtonGroup {...args} activeId={activeId} onChange={setActiveId} />;
  },
};

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
