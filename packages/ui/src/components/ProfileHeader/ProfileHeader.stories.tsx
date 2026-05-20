import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ProfileHeader from '.';

const meta: Meta<typeof ProfileHeader> = {
  title: 'Moleculas/ProfileHeader',
  component: ProfileHeader,
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
type Story = StoryObj<typeof ProfileHeader>;

export const Light: Story = {
  args: {
    name: 'Patricia Álvarez',
    subtitle: 'Administrador · Flota',
    badgeLabel: 'PA',
    badgeSize: 'md',
    titleSize: 'md',
    theme: 'light',
  },
};

export const Dark: Story = {
  args: {
    name: 'Patricia Álvarez',
    subtitle: 'Administrador · Flota',
    badgeLabel: 'PA',
    badgeSize: 'sm',
    titleSize: 'sm',
    theme: 'dark',
  },
};
