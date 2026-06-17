import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas } from '../../../.storybook/canvas';
import Checkbox from '.';

const meta: Meta<typeof Checkbox> = {
  title: 'Atomos/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    theme: 'light',
    label: 'Recordar mi sesión',
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Light: Story = {
  decorators: [lightCanvas],
  args: { theme: 'light' },
};

export const Dark: Story = {
  decorators: [darkCanvas],
  args: { theme: 'dark' },
};

export const Sm: Story = {
  decorators: [lightCanvas],
  args: { size: 'sm', checked: true },
};

export const Md: Story = {
  decorators: [lightCanvas],
  args: { size: 'md' },
};

export const Disabled: Story = {
  decorators: [lightCanvas],
  args: { disabled: true, checked: true },
};
