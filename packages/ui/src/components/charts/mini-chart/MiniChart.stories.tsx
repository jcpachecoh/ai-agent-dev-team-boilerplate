import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { mergeStoryArgs } from '../../../../.storybook/chart-canvas';
import { MiniChart } from './MiniChart';
import type { MiniChartProps } from './MiniChart';

const last7: MiniChartProps['data'] = [
  { value: 12 },
  { value: 18 },
  { value: 15 },
  { value: 22 },
  { value: 19 },
  { value: 25 },
  { value: 28 },
];

const chartWidth = (size: MiniChartProps['size'] = 'sm') =>
  size === 'xl' ? 480 : size === 'md' ? 320 : 220;

const FRAME_PADDING = 24;

const MiniChartFrame = ({
  args,
  children,
}: {
  args: MiniChartProps;
  children: React.ReactNode;
}) => {
  const isDark = args.theme === 'dark';
  const innerWidth = chartWidth(args.size);

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: innerWidth + FRAME_PADDING * 2,
        padding: FRAME_PADDING,
        borderRadius: 16,
        background: isDark ? '#111827' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ width: innerWidth, maxWidth: '100%' }}>{children}</div>
    </div>
  );
};

const meta: Meta<MiniChartProps> = {
  title: 'Charts/MiniChart',

  component: MiniChart as React.ComponentType<MiniChartProps>,

  tags: ['autodocs'],

  render: (args, context) => {
    const mergedArgs = mergeStoryArgs(args, context);
    const resolvedData = mergedArgs.data?.length ? mergedArgs.data : last7;

    return (
      <MiniChartFrame args={mergedArgs}>
        <MiniChart {...mergedArgs} data={resolvedData} />
      </MiniChartFrame>
    );
  },

  args: {
    theme: 'light',
    size: 'sm',
    trend: 'neutral',
    loading: false,
    data: last7,
  },

  argTypes: {
    theme: {
      control: { type: 'radio' },
      options: ['light', 'dark'],
    },

    size: {
      control: { type: 'radio' },
      options: ['sm', 'md', 'xl'],
    },

    trend: {
      control: { type: 'radio' },
      options: ['up', 'down', 'neutral'],
    },

    loading: {
      control: { type: 'boolean' },
    },

    data: {
      control: false,
    },
  },

  parameters: {
    layout: 'centered',
    docs: {
      story: {
        inline: true,
      },
    },
  },
};

export default meta;

type Story = StoryObj<MiniChartProps>;

export const Default: Story = {};

export const TrendUp: Story = {
  args: {
    trend: 'up',
  },
};

export const TrendDown: Story = {
  args: {
    trend: 'down',
    data: [...last7].reverse(),
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    data: [],
  },
};

export const DarkMode: Story = {
  args: {
    theme: 'dark',
    trend: 'up',
  },

  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const InsideKPICard: Story = {
  render: () => (
    <div
      style={{
        maxWidth: 320,
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6c757d',
          marginBottom: 4,
        }}
      >
        Ventas hoy
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        $4.250.000
      </div>

      <div style={{ marginTop: 12 }}>
        <MiniChart data={last7} trend="up" theme="light" size="sm" />
      </div>
    </div>
  ),
};
