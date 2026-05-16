import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BadgeButton from '.';
import { Zap, Activity } from 'lucide-react';

const meta: Meta<typeof BadgeButton> = {
  title: 'Atomos/BadgeButton',
  component: BadgeButton,
  tags: ['autodocs'],
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

export const SystemOk: Story = {
  args: {
    children: 'Sistema OK',
    leftIcon: <Activity />,
    color: '#10b981',
    size: 'md',
  },
};
