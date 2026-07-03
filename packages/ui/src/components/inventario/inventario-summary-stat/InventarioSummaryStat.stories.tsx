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
import { InventarioSummaryStat } from './InventarioSummaryStat';

const meta: Meta<typeof InventarioSummaryStat> = {
  title: 'Inventario/InventarioSummaryStat',
  component: InventarioSummaryStat,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.summaryStat, '2075:2317'),
  argTypes: {
    accent: {
      control: 'select',
      options: ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioSummaryStat>;

export const Default: Story = {};

export const PeriodSummary: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
      <InventarioSummaryStat {...args} label="Items Totales" value="5,000" accent="success" />
      <InventarioSummaryStat {...args} label="Valor Promedio" value="$12,500" accent="info" />
      <InventarioSummaryStat {...args} label="Movimientos" value="245" accent="purple" />
      <InventarioSummaryStat {...args} label="Rotación" value="8.5 días" accent="enterprise" />
    </div>
  ),
  args: { size: 'xl' },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <InventarioSummaryStat {...args} size="sm" />
      <InventarioSummaryStat {...args} size="md" />
      <InventarioSummaryStat {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
