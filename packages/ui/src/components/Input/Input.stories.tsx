import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Lock } from 'lucide-react';

import { darkCanvas, lightCanvas, themeCanvas } from '../../../.storybook/canvas';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atomos/Input',
  component: Input,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    size: 'md',
    showIcon: true,
    placeholder: 'Correo electrónico',
  },
  argTypes: {
    showIcon: { control: 'boolean', description: 'Toggle left icon visibility' },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
  },
  render: (args) => <Input {...args} leftIcon={<Mail />} />,
};

export default meta;
type Story = StoryObj<typeof Input>;

/** Vista por defecto en Docs: un solo input controlado por theme y size. */
export const Default: Story = {};

const sizes = ['sm', 'md', 'lg'] as const;
const themes = ['light', 'dark'] as const;

export const SizeThemeMatrix: Story = {
  parameters: {
    docs: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {themes.map((theme) => (
        <div key={theme}>
          <p style={{ margin: '0 0 8px', fontSize: 12, opacity: 0.7 }}>{theme}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sizes.map((size) => (
              <Input
                key={`${theme}-${size}`}
                theme={theme}
                size={size}
                placeholder={`${size} · ${theme}`}
                leftIcon={<Mail />}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [lightCanvas],
};

export const Password: Story = {
  args: {
    placeholder: 'Contraseña',
    type: 'password',
    showPasswordToggle: true,
    theme: 'dark',
  },
  render: (args) => <Input {...args} leftIcon={<Lock />} />,
  decorators: [darkCanvas],
};

export const WithError: Story = {
  args: {
    error: true,
    theme: 'light',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    theme: 'light',
  },
};

export const DarkMode: Story = {
  args: {
    theme: 'dark',
  },
  decorators: [darkCanvas],
};
