import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaEditButton } from './RecetaEditButton';

const meta: Meta<typeof RecetaEditButton> = {
  title: 'Receta/RecetaEditButton',
  component: RecetaEditButton,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaEditButton>;

export const Default: Story = { args: {} };
export const IconOnly: Story = { args: { iconOnly: true, ariaLabel: 'Editar receta' } };
export const Disabled: Story = { args: { disabled: true } };
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <RecetaEditButton {...args} size="sm" />
      <RecetaEditButton {...args} size="md" />
      <RecetaEditButton {...args} size="xl" />
    </div>
  ),
};
