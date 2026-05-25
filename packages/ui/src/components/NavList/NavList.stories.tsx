import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Bell, Home, Truck } from 'lucide-react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import NavList from '.';

const baseItems = [
  { label: 'Dashboard', icon: <Home size={18} aria-hidden /> },
  { label: 'Viajes', icon: <Truck size={18} aria-hidden /> },
  { label: 'Vehículos', icon: <Truck size={18} aria-hidden /> },
  { label: 'Notificaciones', icon: <Bell size={18} aria-hidden /> },
];

const meta: Meta<typeof NavList> = {
  title: 'Moleculas/NavList',
  component: NavList,
  tags: ['autodocs'],
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    theme: 'light',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof NavList>;

export const Playground: Story = {
  args: {
    items: baseItems.map((it, i) => ({ ...it, active: i === 0 })),
  },
};

export const DarkMode: Story = {
  args: {
    items: baseItems.map((it, i) => ({ ...it, active: i === 0 })),
    theme: 'dark',
    size: 'md',
  },
  ...darkBackground,
};

export const LightMode: Story = {
  args: {
    items: baseItems.map((it, i) => ({ ...it, active: i === 0 })),
    theme: 'light',
    size: 'md',
  },
  ...lightBackground,
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <NavList
          key={size}
          theme="dark"
          size={size}
          maxHeight={280}
          items={baseItems.map((it, i) => ({ ...it, active: i === 0 }))}
        />
      ))}
    </div>
  ),
  ...darkBackground,
};

export const WithScroll: Story = {
  args: {
    theme: 'dark',
    size: 'md',
    maxHeight: 200,
    items: [
      ...baseItems,
      ...baseItems.map((it) => ({ ...it, label: `${it.label} (2)` })),
      ...baseItems.map((it) => ({ ...it, label: `${it.label} (3)` })),
    ],
  },
  ...darkBackground,
};

export const WithActiveItem: Story = {
  args: {
    items: baseItems.map((it, i) => ({ ...it, active: i === 2 })),
    theme: 'dark',
    size: 'lg',
  },
  ...darkBackground,
};
