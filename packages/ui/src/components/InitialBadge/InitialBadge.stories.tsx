import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InitialBadge from '.';

const meta: Meta<typeof InitialBadge> = {
  title: 'Atomos/InitialBadge',
  component: InitialBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InitialBadge>;

export const Default: Story = {
  args: {
    label: 'PA',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    label: 'PA',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'PA',
    size: 'lg',
  },
};
