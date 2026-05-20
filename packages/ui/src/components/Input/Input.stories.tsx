import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Mail, Lock } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'Atomos/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    theme: 'light',
  },
  argTypes: {
    showIcon: { control: 'boolean', description: 'Toggle left icon visibility' },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Email: Story = {
  args: {
    placeholder: 'Correo electrónico',
    leftIcon: <Mail />,
    showIcon: true,
    size: 'md',
    theme: 'light',
  },
};

export const Password: Story = {
  args: {
    placeholder: 'Contraseña',
    type: 'password',
    leftIcon: <Lock />,
    showIcon: true,
    showPasswordToggle: true,
    size: 'md',
    theme: 'light',
  },
};

export const EmailLight: Story = {
  args: {
    placeholder: 'Correo electrónico',
    leftIcon: <Mail />,
    showIcon: true,
    size: 'md',
    theme: 'light',
  },
};

export const PasswordLight: Story = {
  args: {
    placeholder: 'Contraseña',
    type: 'password',
    leftIcon: <Lock />,
    showIcon: true,
    showPasswordToggle: true,
    size: 'md',
    theme: 'light',
  },
};
