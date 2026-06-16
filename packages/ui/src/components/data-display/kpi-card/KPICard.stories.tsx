import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { KPICard } from './KPICard';

const meta: Meta<typeof KPICard> = {
  title: 'Data Display/KPICard',
  component: KPICard,
  tags: ['autodocs'],
  args: {
    theme: 'light',
    size: 'md',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: {
    label: 'Total Sales',
    value: '$45,231.89',
    delta: '+20.1%',
    deltaLabel: 'vs last month',
    trend: 'up',
  },
};

export const Compact: Story = {
  args: {
    label: 'Orders',
    value: '1,234',
    variant: 'compact',
    color: 'info',
  },
};

export const LoadingSkeleton: Story = {
  args: {
    label: 'Total Sales',
    loading: true,
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111', width: '300px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Active Users',
    value: '1,234',
    trend: 'up',
    delta: '+5%',
    theme: 'dark',
  },
};
