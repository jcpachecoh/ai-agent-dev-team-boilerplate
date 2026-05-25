import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { LoginFields } from './LoginFields';

const meta: Meta<typeof LoginFields> = {
  title: 'Moleculas/LoginFields',
  component: LoginFields,
  tags: ['autodocs'],
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    theme: 'dark',
    size: 'md',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginFields>;

export const Playground: Story = {};

export const SmLight: Story = {
  args: { size: 'sm', theme: 'light' },
  ...lightBackground,
};

export const MdDark: Story = {
  args: { size: 'md', theme: 'dark' },
  ...darkBackground,
};

export const LgLight: Story = {
  args: { size: 'lg', theme: 'light' },
  ...lightBackground,
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <LoginFields key={size} size={size} theme="dark" />
      ))}
    </div>
  ),
  ...darkBackground,
};

export const DarkMode: Story = {
  args: { theme: 'dark', size: 'md' },
  ...darkBackground,
};

export const LightMode: Story = {
  args: { theme: 'light', size: 'md' },
  ...lightBackground,
};
