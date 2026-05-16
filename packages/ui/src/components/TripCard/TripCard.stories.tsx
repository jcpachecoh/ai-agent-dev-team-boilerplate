import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TripCard from './';

const meta: Meta<typeof TripCard> = {
  title: 'Molecules/TripCard',
  component: TripCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TripCard>;

export const Light: Story = {
  args: {
    title: 'Viaje 001',
    subtitle: 'ABC-123 · Furgón',
    variant: 'light',
  },
};

export const Dark: Story = {
  args: {
    title: 'Viaje 001',
    subtitle: 'ABC-123 · Furgón',
    variant: 'dark',
  },
};
