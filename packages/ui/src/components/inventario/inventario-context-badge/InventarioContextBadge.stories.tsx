import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioContextBadge } from './InventarioContextBadge';

const meta: Meta<typeof InventarioContextBadge> = {
  title: 'Inventario/InventarioContextBadge',
  component: InventarioContextBadge,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.contextBadge, '2075:601'),
};

export default meta;
type Story = StoryObj<typeof InventarioContextBadge>;

export const Status: Story = {
  args: { label: 'PLANTA CENTRAL', variant: 'status' },
};

export const Shift: Story = {
  args: { label: 'TURNO MAÑANA', variant: 'shift' },
};

export const Both: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24 }}>
      <InventarioContextBadge {...args} variant="status" label="PLANTA CENTRAL" />
      <InventarioContextBadge {...args} variant="shift" label="TURNO MAÑANA" />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Status.args, theme: 'dark' },
};

export const LightMode: Story = {
  args: { ...Status.args, theme: 'light' },
  decorators: [inventarioLightDecorator],
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <InventarioContextBadge {...args} size="sm" variant="status" />
      <InventarioContextBadge {...args} size="md" variant="status" />
      <InventarioContextBadge {...args} size="xl" variant="status" />
    </div>
  ),
  args: Status.args,
};
