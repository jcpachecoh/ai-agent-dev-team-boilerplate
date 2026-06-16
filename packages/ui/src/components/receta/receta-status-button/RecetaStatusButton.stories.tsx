import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaStatusButton } from './RecetaStatusButton';

const meta: Meta<typeof RecetaStatusButton> = {
  title: 'Receta/RecetaStatusButton',
  component: RecetaStatusButton,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaStatusButton>;

export const Active: Story = { args: { status: 'active' } };
export const Inactive: Story = { args: { status: 'inactive' } };
export const ToggleExample: Story = {
  render: (args) => {
    const [active, setActive] = useState(true);
    return (
      <RecetaStatusButton
        {...args}
        status={active ? 'active' : 'inactive'}
        onClick={() => setActive((v) => !v)}
      />
    );
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <RecetaStatusButton {...args} size="sm" />
      <RecetaStatusButton {...args} size="md" />
      <RecetaStatusButton {...args} size="xl" />
    </div>
  ),
};
