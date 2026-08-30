import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { RecetaPhaseAddButton } from './RecetaPhaseAddButton';

const meta: Meta<typeof RecetaPhaseAddButton> = {
  title: 'Receta/RecetaPhaseAddButton',
  component: RecetaPhaseAddButton,
  tags: ['autodocs'],
  args: {
    label: 'Agregar Fase',
    theme: 'dark',
    size: 'md',
  },
};

export default meta;

type Story = StoryObj<typeof RecetaPhaseAddButton>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <RecetaPhaseAddButton {...args} size="sm" />
      <RecetaPhaseAddButton {...args} size="md" />
      <RecetaPhaseAddButton {...args} size="xl" />
    </div>
  ),
};

export const Light: Story = {
  args: {
    theme: 'light',
  },
};
