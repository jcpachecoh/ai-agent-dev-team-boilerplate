import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MapPin } from 'lucide-react';
import { darkBackground, lightBackground, themeComparison } from '../../storybook/theme-helpers';
import TripCard from './';

const meta: Meta<typeof TripCard> = {
  title: 'Moleculas/TripCard',
  component: TripCard,
  tags: ['autodocs'],
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    title: 'Viaje 001',
    subtitle: 'ABC-123 · Furgón',
    theme: 'light',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof TripCard>;

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
  render: themeComparison(TripCard, 'theme'),
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24, maxWidth: 480 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TripCard key={size} {...args} size={size} title={`Viaje (${size})`} />
      ))}
    </div>
  ),
  args: { theme: 'light' },
  ...lightBackground,
};

export const AllSizesDark: Story = {
  ...AllSizes,
  args: { theme: 'dark' },
  ...darkBackground,
};

export const CustomIcons: Story = {
  args: {
    leftIcon: <MapPin size={20} aria-hidden />,
    theme: 'light',
  },
};

/** @deprecated — use `theme` */
export const Light: Story = {
  args: { variant: 'light' },
  ...lightBackground,
};

/** @deprecated — use `theme` */
export const Dark: Story = {
  args: { variant: 'dark' },
  ...darkBackground,
};
