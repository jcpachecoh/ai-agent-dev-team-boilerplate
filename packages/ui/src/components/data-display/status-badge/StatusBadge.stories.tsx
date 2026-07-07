import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Data Display/StatusBadge',
  component: StatusBadge,
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
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  args: {
    status: 'SUCCESS',
  },
};

export const AnimatedActive: Story = {
  args: {
    status: 'ACTIVE',
    animated: true,
  },
};

export const DotOnly: Story = {
  args: {
    status: 'OK',
    variant: 'dot',
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
    status: 'PROCESSING',
    animated: true,
    theme: 'dark',
  },
};
