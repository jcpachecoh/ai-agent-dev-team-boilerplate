import type { Meta, StoryObj } from '@storybook/react';

import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    variant: {
      control: 'select',
      options: ['success', 'warning', 'danger', 'info', 'auto'],
    },
    type: {
      control: 'select',
      options: ['linear', 'circular'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Linear: Story = {
  args: {
    value: 45,
    type: 'linear',
    showLabel: true,
  },
};

export const Circular: Story = {
  args: {
    value: 75,
    type: 'circular',
    showLabel: true,
  },
};

export const AutoVariantSuccess: Story = {
  args: {
    value: 30,
    variant: 'auto',
    showLabel: true,
  },
};

export const AutoVariantWarning: Story = {
  args: {
    value: 70,
    variant: 'auto',
    showLabel: true,
  },
};

export const AutoVariantDanger: Story = {
  args: {
    value: 90,
    variant: 'auto',
    showLabel: true,
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
    value: 60,
    showLabel: true,
  },
};
