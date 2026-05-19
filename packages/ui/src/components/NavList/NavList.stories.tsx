import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NavList from '.';

const meta: Meta<typeof NavList> = {
  title: 'Moleculas/NavList',
  component: NavList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavList>;

import { Home, Truck, Bell } from 'lucide-react';

const commonItems = [
  { label: 'Dashboard', icon: <Home /> },
  { label: 'Viajes', icon: <Truck /> },
  { label: 'Vehículos', icon: <Truck /> },
  { label: 'Notificaciones', icon: <Bell /> },
];

export const Light: Story = {
  args: {
    items: commonItems.map((it) => ({ ...it })),
    theme: 'light',
  },
};

export const Dark: Story = {
  args: {
    items: commonItems.map((it, i) => ({ ...it, active: i === 0 })),
    theme: 'dark',
  },
};
