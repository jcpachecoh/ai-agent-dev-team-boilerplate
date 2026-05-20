import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PasswordRow from '.';

const meta: Meta<typeof PasswordRow> = {
  title: 'Atomos/PasswordRow',
  component: PasswordRow,
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
type Story = StoryObj<typeof PasswordRow>;

export const Light: Story = {
  args: {
    variant: 'light',
    label: 'Contraseña',
    actionText: '¿Olvidaste tu contraseña?',
    size: 'md',
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    label: 'Contraseña',
    actionText: '¿Olvidaste tu contraseña?',
    size: 'md',
  },
};

export const LightSmall: Story = {
  args: {
    variant: 'light',
    label: 'Contraseña',
    actionText: '¿Olvidaste tu contraseña?',
    size: 'sm',
  },
};

export const DarkLarge: Story = {
  args: {
    variant: 'dark',
    label: 'Contraseña',
    actionText: '¿Olvidaste tu contraseña?',
    size: 'lg',
  },
};
