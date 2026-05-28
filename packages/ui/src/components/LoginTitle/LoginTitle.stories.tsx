import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas, themeCanvas } from '../../../.storybook/canvas';
import LoginTitle from '.';

const meta: Meta<typeof LoginTitle> = {
  title: 'Atomos/LoginTitle',
  component: LoginTitle,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    titleSize: 'md',
  },
  argTypes: {
    theme: {
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

export const Default: Story = {};

export const Light: Story = {
  decorators: [lightCanvas],
  args: { theme: 'light' },
};

export const Dark: Story = {
  decorators: [darkCanvas],
  args: { theme: 'dark' },
};

export const TitleSizeMatrix: Story = {
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <LoginTitle theme="dark" titleSize="sm" />
      <LoginTitle theme="dark" titleSize="md" />
      <LoginTitle theme="dark" titleSize="lg" />
    </div>
  ),
};

export const WithStatusDot: Story = {
  decorators: [darkCanvas],
  args: {
    theme: 'dark',
    title: 'Planificación de Despachos',
    subtitle: 'Sistema operativo · Lunes, 11 de Mayo 2026',
    statusColor: '#00c950',
    titleSize: 'sm',
  },
};
