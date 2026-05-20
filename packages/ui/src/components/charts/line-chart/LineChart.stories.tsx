import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { LineChart } from './LineChart';

const salesByHour = [
  { hour: '08:00', ventas: 420000, meta: 500000 },
  { hour: '10:00', ventas: 680000, meta: 500000 },
  { hour: '12:00', ventas: 920000, meta: 500000 },
  { hour: '14:00', ventas: 750000, meta: 500000 },
  { hour: '16:00', ventas: 1100000, meta: 500000 },
  { hour: '18:00', ventas: 890000, meta: 500000 },
];

const meta: Meta = {
  title: 'Charts/LineChart',
  component: LineChart,
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
type Story = StoryObj<typeof LineChart>;

export const Default: Story = {
  args: {
    data: salesByHour,
    xDataKey: 'hour',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
  },
};

export const MultiSeries: Story = {
  args: {
    data: [
      { hour: 'Lun', sedeA: 1200000, sedeB: 980000 },
      { hour: 'Mar', sedeA: 1350000, sedeB: 1020000 },
      { hour: 'Mié', sedeA: 1280000, sedeB: 1100000 },
    ],
    xDataKey: 'hour',
    series: [
      { dataKey: 'sedeA', name: 'Sede Norte' },
      { dataKey: 'sedeB', name: 'Sede Sur', colorIndex: 1 },
    ],
  },
};

export const WithReferenceLine: Story = {
  args: {
    data: salesByHour,
    xDataKey: 'hour',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    referenceLine: { value: 500000, label: 'Meta del día' },
    valueType: 'currency',
  },
};

export const CurrencyTooltip: Story = {
  args: {
    data: salesByHour,
    xDataKey: 'hour',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    valueType: 'currency',
  },
};

export const Loading: Story = { args: { loading: true, data: [], xDataKey: 'hour', series: [] } };
export const Empty: Story = {
  args: { data: [], xDataKey: 'hour', series: [{ dataKey: 'ventas', name: 'Ventas' }] },
};

export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: {
    theme: 'dark',
    data: salesByHour,
    xDataKey: 'hour',
    series: [{ dataKey: 'ventas', name: 'Ventas' }],
    valueType: 'currency',
  },
};
