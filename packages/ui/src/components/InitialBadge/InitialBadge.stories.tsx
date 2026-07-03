import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas } from '../../../.storybook/canvas';
import InitialBadge from '.';

const meta: Meta<typeof InitialBadge> = {
  title: 'Atomos/InitialBadge',
  component: InitialBadge,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    theme: { control: 'radio', options: ['light', 'dark'] },
  },
};

export default meta;
type Story = StoryObj<typeof InitialBadge>;

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <InitialBadge label="PA" size="sm" />
      <InitialBadge label="PA" size="md" />
      <InitialBadge label="PA" size="lg" />
    </div>
  ),
};

export const Light: Story = {
  decorators: [lightCanvas],
  args: { label: 'PA', theme: 'light', size: 'md' },
};

export const Dark: Story = {
  decorators: [darkCanvas],
  args: { label: 'PA', theme: 'dark', size: 'md' },
};
