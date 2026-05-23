import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground, themeComparison } from '../../storybook/theme-helpers';
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
    badgeSize: { control: 'radio', options: ['sm', 'md', 'lg'] },
    titleSize: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileHeader>;

export const Playground: Story = {
  args: {
    name: 'Patricia Álvarez',
    subtitle: 'Administrador · Flota',
    badgeLabel: 'PA',
    badgeSize: 'md',
    titleSize: 'md',
  },
};

export const LightMode: Story = {
  args: {
    theme: 'light',
    badgeSize: 'md',
    titleSize: 'md',
  },
  ...lightBackground,
};

export const DarkMode: Story = {
  args: {
    theme: 'dark',
    badgeSize: 'md',
    titleSize: 'md',
  },
  ...darkBackground,
};

export const ThemeComparison: Story = {
  render: themeComparison(ProfileHeader),
  args: {
    name: 'Patricia Álvarez',
    subtitle: 'Administrador · Flota',
    badgeLabel: 'PA',
  },
};

export const SizeMatrix: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {(['sm', 'md', 'lg'] as const).flatMap((badgeSize) =>
        (['sm', 'md', 'lg'] as const).map((titleSize) => (
          <ProfileHeader
            key={`${badgeSize}-${titleSize}`}
            {...args}
            badgeSize={badgeSize}
            titleSize={titleSize}
            subtitle={`badge ${badgeSize} · title ${titleSize}`}
          />
        )),
      )}
    </div>
  ),
  args: { theme: 'light' },
  ...lightBackground,
};

export const SizeMatrixDark: Story = {
  ...SizeMatrix,
  args: { theme: 'dark' },
  ...darkBackground,
};

export const Light: Story = LightMode;
export const Dark: Story = DarkMode;
