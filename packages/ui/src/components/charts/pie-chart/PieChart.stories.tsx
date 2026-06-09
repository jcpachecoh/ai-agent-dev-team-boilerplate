import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { PieChart } from './PieChart';

const costData = [
  { name: 'Insumos', value: 4500000 },
  { name: 'Labor', value: 3200000 },
  { name: 'Overhead', value: 1800000 },
];

const meta: Meta = {
  title: 'Charts/PieChart',
  component: PieChart,
  tags: ['autodocs'],
  args: { theme: 'light', size: 'md' },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
    variant: { control: 'radio', options: ['pie', 'donut'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 360, height: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PieChart>;

export const Pie: Story = {
  args: { variant: 'pie', data: costData, valueType: 'currency' },
};

export const Donut: Story = {
  args: { variant: 'donut', data: costData, valueType: 'currency' },
};

export const DonutWithCenterTotal: Story = {
  args: { variant: 'donut', data: costData, valueType: 'currency' },
};

export const CurrencyTooltip: Story = {
  args: { variant: 'donut', data: costData, valueType: 'currency' },
};

export const Loading: Story = { args: { loading: true, data: [] } };
export const Empty: Story = { args: { data: [] } };

export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: { theme: 'dark', variant: 'donut', data: costData, valueType: 'currency' },
};
