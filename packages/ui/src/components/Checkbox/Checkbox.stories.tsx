import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Checkbox from '.';

const meta: Meta<typeof Checkbox> = {
  title: 'Atomos/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    variant: 'light',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Light: Story = {
  args: {
    label: 'Recordar mi sesión',
    variant: 'light',
  },
};

export const Dark: Story = {
  args: {
    label: 'Recordar mi sesión',
    variant: 'dark',
  },
};
