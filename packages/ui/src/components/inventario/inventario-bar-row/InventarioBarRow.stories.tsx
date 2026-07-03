import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import type { InventarioBarRowItem } from '../shared/inventario-types';
import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import { inventarioLightDecorator, inventarioStoryMeta } from '../shared/story-decorators';
import { InventarioBarRow } from './InventarioBarRow';

const topProducts: InventarioBarRowItem[] = [
  { label: 'POLLO ENTERO', value: 850, progress: 100, accent: 'success' },
  { label: 'CARNE MOLIDA', value: 620, progress: 73, accent: 'success' },
  { label: 'ARROZ BLANCO', value: 580, progress: 68, accent: 'success' },
  { label: 'ACEITE VEGETAL', value: 450, progress: 53, accent: 'warning' },
  { label: 'CEBOLLA', value: 220, progress: 26, accent: 'danger' },
];

const meta: Meta<typeof InventarioBarRow> = {
  title: 'Inventario/InventarioBarRow',
  component: InventarioBarRow,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.barRow, '2075:690'),
  argTypes: {
    accent: {
      control: 'select',
      options: ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'],
    },
    density: {
      control: 'radio',
      options: ['compact', 'comfortable'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioBarRow>;

export const Default: Story = {
  args: { label: 'POLLO ENTERO', value: 850, progress: 100, accent: 'success' },
};

export const TopProductsList: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 535 }}>
      {topProducts.map((item) => (
        <InventarioBarRow
          key={item.label}
          {...args}
          label={item.label}
          value={item.value}
          progress={item.progress}
          accent={item.accent}
        />
      ))}
    </div>
  ),
};

export const ComfortableDensity: Story = {
  args: {
    ...Default.args,
    density: 'comfortable',
    label: 'Planta Central',
    value: '45%',
    progress: 45,
    accent: 'success',
  },
};

export const DarkMode: Story = {
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { ...Default.args, theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 400 }}>
      <InventarioBarRow {...args} size="sm" />
      <InventarioBarRow {...args} size="md" />
      <InventarioBarRow {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
