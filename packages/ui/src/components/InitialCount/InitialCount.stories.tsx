import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas, themeCanvas } from '../../../.storybook/canvas';
import InitialCount from '.';

const meta: Meta<typeof InitialCount> = {
  title: 'Atomos/InitialCount',
  component: InitialCount,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    label: 'Pendientes',
    number: 6,
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    numberColor: {
      control: 'color',
      description: 'Override del color del número (vacío = token por theme)',
    },
    labelColor: {
      control: 'color',
      description: 'Override del color del label (vacío = token por theme)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InitialCount>;

export const Light: Story = {
  args: {
    theme: 'light',
    numberColor: undefined,
    labelColor: undefined,
  },
};

export const Dark: Story = {
  args: {
    label: 'Completados',
    number: 8,
    theme: 'dark',
    numberColor: undefined,
    labelColor: undefined,
  },
};

export const AllSizes: Story = {
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
      <InitialCount label="Pendientes" number={6} theme="dark" size="sm" />
      <InitialCount label="Pendientes" number={6} theme="dark" size="md" />
      <InitialCount label="Pendientes" number={6} theme="dark" size="lg" />
    </div>
  ),
};

export const CustomNumberColor: Story = {
  decorators: [lightCanvas],
  args: {
    label: 'Urgentes',
    number: 12,
    theme: 'light',
    numberColor: '#ef4444',
    size: 'lg',
  },
};
