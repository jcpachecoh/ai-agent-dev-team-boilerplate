import type { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground, themeComparison } from '../../storybook/theme-helpers';
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

export const Playground: Story = {};

export const LightMode: Story = {
  args: { theme: 'light' },
  ...lightBackground,
};

export const DarkMode: Story = {
  args: { theme: 'dark' },
  ...darkBackground,
};

export const ThemeComparison: Story = {
  render: themeComparison(Card),
};

export const CustomValues: Story = {
  args: {
    count: 8,
    total: 12,
    title: 'Vehículos Disponibles',
    theme: 'light',
  },
  ...lightBackground,
};
