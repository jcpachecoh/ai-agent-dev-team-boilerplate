import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas } from '../../../.storybook/canvas';
import LoginTitle from '.';

const meta: Meta<typeof LoginTitle> = {
  title: 'Atomos/LoginTitle',
  component: LoginTitle,
  tags: ['autodocs'],
  args: {
    variant: 'light',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['light', 'dark'],
    },
    titleSize: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginTitle>;

export const Light: Story = {
  decorators: [lightCanvas],
  args: { variant: 'light' },
};

export const Dark: Story = {
  decorators: [darkCanvas],
  args: { variant: 'dark' },
};

export const TitleSizeMatrix: Story = {
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <LoginTitle variant="dark" titleSize="sm" />
      <LoginTitle variant="dark" titleSize="md" />
      <LoginTitle variant="dark" titleSize="lg" />
    </div>
  ),
};

export const WithStatusDot: Story = {
  decorators: [darkCanvas],
  args: {
    variant: 'dark',
    title: 'Planificación de Despachos',
    subtitle: 'Sistema operativo · Lunes, 11 de Mayo 2026',
    statusColor: '#00c950',
    titleSize: 'sm',
  },
};
