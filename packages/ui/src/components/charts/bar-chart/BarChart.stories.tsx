import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { BarChart } from './BarChart';

const meta: Meta = {
  title: 'Charts/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  args: { theme: 'light', size: 'md' },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
    variant: { control: 'select', options: ['simple', 'grouped', 'stacked', 'horizontal'] },
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
type Story = StoryObj<typeof BarChart>;

const products = [
  { name: 'Hamburguesa', ventas: 1250000 },
  { name: 'Pizza', ventas: 980000 },
  { name: 'Ensalada', ventas: 420000 },
];

export const Simple: Story = {
  args: {
    variant: 'simple',
    data: products,
    xDataKey: 'name',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    valueType: 'currency',
  },
};

export const Grouped: Story = {
  args: {
    variant: 'grouped',
    data: [
      { mes: 'Ene', actual: 3200000, anterior: 2800000 },
      { mes: 'Feb', actual: 3500000, anterior: 3100000 },
    ],
    xDataKey: 'mes',
    series: [
      { dataKey: 'actual', name: '2026' },
      { dataKey: 'anterior', name: '2025', colorIndex: 2 },
    ],
    valueType: 'currency',
  },
};

export const Stacked: Story = {
  args: {
    variant: 'stacked',
    data: [
      { categoria: 'Q1', insumos: 800000, labor: 600000, overhead: 200000 },
      { categoria: 'Q2', insumos: 920000, labor: 650000, overhead: 220000 },
    ],
    xDataKey: 'categoria',
    series: [
      { dataKey: 'insumos', name: 'Insumos' },
      { dataKey: 'labor', name: 'Labor', colorIndex: 1 },
      { dataKey: 'overhead', name: 'Overhead', colorIndex: 3 },
    ],
    valueType: 'currency',
  },
};

export const HorizontalRanking: Story = {
  args: {
    variant: 'horizontal',
    data: products,
    xDataKey: 'name',
    series: [{ dataKey: 'ventas', name: 'Costo' }],
    valueType: 'currency',
  },
};

export const CurrencyTooltip: Story = {
  args: {
    data: products,
    xDataKey: 'name',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    valueType: 'currency',
  },
};

export const Loading: Story = { args: { loading: true, data: [], xDataKey: 'name', series: [] } };
export const Empty: Story = {
  args: { data: [], xDataKey: 'name', series: [{ dataKey: 'ventas', name: 'Ventas' }] },
};

export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: {
    theme: 'dark',
    data: products,
    xDataKey: 'name',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    valueType: 'currency',
  },
};
