import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LoginTitle from '.';

const meta: Meta<typeof LoginTitle> = {
  title: 'Atomos/LoginTitle',
  component: LoginTitle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginTitle>;

export const Light: Story = {
  args: {
    variant: 'light',
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
  },
};

export const WithStatus: Story = {
  args: {
    variant: 'dark',
    title: 'Planificación de Despachos',
    subtitle: 'Sistema operativo · Lunes, 11 de Mayo 2026',
    statusColor: '#00c950',
    titleSize: 'sm',
  },
};
