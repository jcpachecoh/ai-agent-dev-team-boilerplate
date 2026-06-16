import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'table'],
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: 200,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 40,
    height: 40,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};

export const Table: Story = {
  args: {
    variant: 'table',
    width: '100%',
  },
};

export const DashboardCard: Story = {
  render: (args) => (
    <div
      style={{
        width: 360,
        padding: 20,
        borderRadius: 12,
        border: '1px solid rgba(0, 0, 0, 0.09)',
        background: '#fff',
      }}
    >
      <Skeleton {...args} variant="text" width="62%" />
      <div style={{ height: 16 }} />
      <Skeleton {...args} variant="rectangular" height={88} />
      <div style={{ height: 12 }} />
      <Skeleton {...args} variant="text" width="84%" />
      <Skeleton {...args} variant="text" width="48%" />
    </div>
  ),
};

export const Pulse: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
    animation: 'pulse',
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};
