import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { AreaChart } from './AreaChart';

const mrrData = [
  { month: 'Ene', mrr: 12000000 },
  { month: 'Feb', mrr: 13200000 },
  { month: 'Mar', mrr: 14500000 },
  { month: 'Abr', mrr: 15800000 },
];

const meta: Meta = {
  title: 'Charts/AreaChart',
  component: AreaChart,
  tags: ['autodocs'],
  args: { theme: 'light', size: 'md' },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 480, height: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AreaChart>;

export const Default: Story = {
  args: { data: mrrData, xDataKey: 'month', series: [{ dataKey: 'mrr', name: 'MRR' }] },
};

export const MultiSeries: Story = {
  args: {
    data: [
      { month: 'Ene', inventario: 8000000, valoracion: 8200000 },
      { month: 'Feb', inventario: 8500000, valoracion: 8700000 },
    ],
    xDataKey: 'month',
    series: [
      { dataKey: 'inventario', name: 'Inventario' },
      { dataKey: 'valoracion', name: 'Valoración', colorIndex: 2 },
    ],
  },
};

export const GradientFill: Story = {
  args: { data: mrrData, xDataKey: 'month', series: [{ dataKey: 'mrr', name: 'MRR' }] },
};

export const CurrencyTooltip: Story = {
  args: {
    data: mrrData,
    xDataKey: 'month',
    series: [{ dataKey: 'mrr', name: 'MRR' }],
    valueType: 'currency',
  },
};

export const Loading: Story = { args: { loading: true, data: [], xDataKey: 'month', series: [] } };
export const Empty: Story = {
  args: { data: [], xDataKey: 'month', series: [{ dataKey: 'mrr', name: 'MRR' }] },
};

export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: {
    theme: 'dark',
    data: mrrData,
    xDataKey: 'month',
    series: [{ dataKey: 'mrr', name: 'MRR' }],
    valueType: 'currency',
  },
};
