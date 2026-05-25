import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Bell } from 'lucide-react';

import { darkCanvas, themeCanvas } from '../../../.storybook/canvas';
import NotificationButton from '.';

const meta: Meta<typeof NotificationButton> = {
  title: 'Atomos/NotificationButton',
  component: NotificationButton,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    count: 3,
    showBadge: true,
    gold: false,
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    gold: {
      control: 'boolean',
      description: 'Estilo dorado (accent)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationButton>;

export const Default: Story = {};

export const Gold: Story = {
  args: {
    gold: true,
    theme: 'light',
    count: 3,
  },
  decorators: [darkCanvas],
};

export const CustomLucideIcon: Story = {
  args: {
    theme: 'dark',
    icon: <Bell strokeWidth={2.5} />,
    count: 5,
  },
};

export const AllSizes: Story = {
  parameters: {
    docs: { disable: true },
  },
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <NotificationButton theme="dark" size="sm" count={2} />
      <NotificationButton theme="dark" size="md" count={3} />
      <NotificationButton theme="dark" size="lg" count={9} />
    </div>
  ),
};

export const WithBadgeCount: Story = {
  args: {
    theme: 'light',
    count: 12,
  },
};
