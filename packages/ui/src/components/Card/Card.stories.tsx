import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
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
