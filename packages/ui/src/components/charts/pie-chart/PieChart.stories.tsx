import type { Meta, StoryObj } from '@storybook/react';

import { createChartRender } from '../../../../.storybook/chart-canvas';
import { PieChart } from './PieChart';

const costData = [
  { name: 'Insumos', value: 4500000 },
  { name: 'Labor', value: 3200000 },
  { name: 'Overhead', value: 1800000 },
];

const meta: Meta<typeof PieChart> = {
  title: 'Charts/PieChart',
  component: PieChart,
  tags: ['autodocs'],
  render: createChartRender(PieChart, 'PieChart', { maxWidth: 360 }),
  args: { theme: 'light', size: 'md' },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
    variant: { control: 'radio', options: ['pie', 'donut'] },
  },
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
