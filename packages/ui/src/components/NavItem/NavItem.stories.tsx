import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NavItem from '.';

const meta: Meta<typeof NavItem> = {
  title: 'Atomos/NavItem',
  component: NavItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Light: Story = {
  args: {
    label: 'Dashboard',
    variant: 'light',
  },
};

export const Dark: Story = {
  args: {
    label: 'Dashboard',
    variant: 'dark',
  },
};

export const Active: Story = {
  args: {
    label: 'Dashboard',
    variant: 'light',
    active: true,
  },
};
