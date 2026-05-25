import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Zap, Activity } from 'lucide-react';

import { darkCanvas, lightCanvas } from '../../../.storybook/canvas';
import BadgeButton from '.';

const meta: Meta<typeof BadgeButton> = {
  title: 'Atomos/BadgeButton',
  component: BadgeButton,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    theme: { control: 'radio', options: ['light', 'dark'] },
  },
};

export default meta;
type Story = StoryObj<typeof BadgeButton>;

export const AIOptimized: Story = {
  args: {
    children: 'AI-Optimizado',
    leftIcon: <Zap />,
    color: '#d4a017',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <BadgeButton leftIcon={<Zap />} color="#d4a017" size="sm">
        Small
      </BadgeButton>
      <BadgeButton leftIcon={<Zap />} color="#d4a017" size="md">
        Medium
      </BadgeButton>
      <BadgeButton leftIcon={<Zap />} color="#d4a017" size="lg">
        Large
      </BadgeButton>
    </div>
  ),
};

export const Light: Story = {
  decorators: [lightCanvas],
  args: {
    children: 'Sistema OK',
    leftIcon: <Activity />,
    color: '#10b981',
    theme: 'light',
    size: 'md',
  },
};

export const Dark: Story = {
  decorators: [darkCanvas],
  args: {
    children: 'Sistema OK',
    leftIcon: <Activity />,
    color: '#10b981',
    theme: 'dark',
    size: 'md',
  },
};
