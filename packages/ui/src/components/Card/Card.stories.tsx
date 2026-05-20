import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Moleculas/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    theme: 'light',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    theme: 'light',
  },
};

export const CustomValues: Story = {
  args: {
    count: 8,
    total: 12,
    title: 'Vehículos Disponibles',
  },
};

export const Dark: Story = {
  args: {
    theme: 'dark',
    count: 3,
    total: 4,
  },
};
