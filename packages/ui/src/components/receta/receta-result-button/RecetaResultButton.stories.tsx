import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaResultButton } from './RecetaResultButton';

const meta: Meta<typeof RecetaResultButton> = {
  title: 'Receta/RecetaResultButton',
  component: RecetaResultButton,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaResultButton>;

export const Ok: Story = { args: { variant: 'ok' } };
export const Warning: Story = { args: { variant: 'warning' } };
export const Failed: Story = { args: { variant: 'failed' } };
export const Disabled: Story = { args: { disabled: true } };
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <RecetaResultButton {...args} size="sm" />
      <RecetaResultButton {...args} size="md" />
      <RecetaResultButton {...args} size="xl" />
    </div>
  ),
};
