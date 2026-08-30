import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, ArrowLeftRight, Box, DollarSign } from 'lucide-react';
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
import { InventarioMetricCard } from './InventarioMetricCard';

const meta: Meta<typeof InventarioMetricCard> = {
  title: 'Inventario/InventarioMetricCard',
  component: InventarioMetricCard,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.metricCard, '2075:643'),
  argTypes: {
    accent: {
      control: 'select',
      options: ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioMetricCard>;

export const TotalItems: Story = {
  args: {
    label: 'Total Items',
    value: '1,250',
    accent: 'success',
    icon: <Box aria-hidden />,
  },
};

export const ValorTotal: Story = {
  args: {
    label: 'Valor Total',
    value: '$1.250.000.000',
    accent: 'info',
    icon: <DollarSign aria-hidden />,
  },
};

export const StockBajo: Story = {
  args: {
    label: 'Stock Bajo',
    value: '5 items',
    accent: 'warning',
    icon: <AlertTriangle aria-hidden />,
  },
};

export const MovimientosHoy: Story = {
  args: {
    label: 'Movimientos Hoy',
    value: '12',
    accent: 'purple',
    icon: <ArrowLeftRight aria-hidden />,
  },
};

export const DashboardRow: Story = {
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16,
        width: '100%',
      }}
    >
      <InventarioMetricCard
        {...args}
        label="Total Items"
        value="1,250"
        accent="success"
        icon={<Box aria-hidden />}
      />
      <InventarioMetricCard
        {...args}
        label="Valor Total"
        value="$1.250.000.000"
        accent="info"
        icon={<DollarSign aria-hidden />}
      />
      <InventarioMetricCard
        {...args}
        label="Stock Bajo"
        value="5 items"
        accent="warning"
        icon={<AlertTriangle aria-hidden />}
      />
      <InventarioMetricCard
        {...args}
        label="Movimientos Hoy"
        value="12"
        accent="purple"
        icon={<ArrowLeftRight aria-hidden />}
      />
    </div>
  ),
  args: { size: 'xl' },
};

export const Loading: Story = { args: { loading: true } };

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...TotalItems.args, theme: 'dark' },
};

export const LightMode: Story = {
  args: { ...TotalItems.args, theme: 'light' },
  decorators: [inventarioLightDecorator],
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InventarioMetricCard {...args} size="sm" />
      <InventarioMetricCard {...args} size="md" />
      <InventarioMetricCard {...args} size="xl" />
    </div>
  ),
  args: TotalItems.args,
};
