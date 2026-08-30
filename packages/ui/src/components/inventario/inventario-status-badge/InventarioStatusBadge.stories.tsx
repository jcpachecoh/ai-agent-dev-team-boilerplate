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
import { InventarioStatusBadge } from './InventarioStatusBadge';

const meta: Meta<typeof InventarioStatusBadge> = {
  title: 'Inventario/InventarioStatusBadge',
  component: InventarioStatusBadge,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.statusBadge, '2075:1680'),
  argTypes: {
    domain: { control: 'radio', options: ['movement', 'severity'] },
    status: {
      control: 'select',
      options: ['entrada', 'salida', 'consumo', 'ajuste', 'critical', 'warning', 'resolved'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioStatusBadge>;

export const Entrada: Story = { args: { domain: 'movement', status: 'entrada' } };
export const Salida: Story = { args: { domain: 'movement', status: 'salida' } };
export const Critical: Story = { args: { domain: 'severity', status: 'critical' } };
export const Resolved: Story = { args: { domain: 'severity', status: 'resolved' } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Entrada.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Entrada.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <InventarioStatusBadge {...args} size="sm" />
      <InventarioStatusBadge {...args} size="md" />
      <InventarioStatusBadge {...args} size="xl" />
    </div>
  ),
  args: Entrada.args,
};
