import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InitialCount from '.';

const meta: Meta<typeof InitialCount> = {
  title: 'Atomos/InitialCount',
  component: InitialCount,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InitialCount>;

export const Light: Story = {
  args: {
    label: 'Pendientes',
    number: 6,
    theme: 'light',
    numberColor: '#2F82FF',
    size: 'md',
  },
};

export const Dark: Story = {
  args: {
    label: 'Completados',
    number: 8,
    theme: 'dark',
    numberColor: '#22c55e',
    size: 'md',
  },
};

export const CustomNumberColor: Story = {
  args: {
    label: 'Urgentes',
    number: 12,
    theme: 'light',
    numberColor: '#ef4444',
    size: 'lg',
  },
};
