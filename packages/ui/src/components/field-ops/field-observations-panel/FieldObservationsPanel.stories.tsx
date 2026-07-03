import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { FieldObservationsPanel } from './FieldObservationsPanel';

const meta: Meta<typeof FieldObservationsPanel> = {
  title: 'Field Ops/FieldObservationsPanel',
  component: FieldObservationsPanel,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof FieldObservationsPanel>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}
    >
      <FieldObservationsPanel {...args} size="sm" />
      <FieldObservationsPanel {...args} size="md" />
      <FieldObservationsPanel {...args} size="xl" />
    </div>
  ),
};
