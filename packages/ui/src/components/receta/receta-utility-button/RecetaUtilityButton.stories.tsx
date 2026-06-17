import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaUtilityButton } from './RecetaUtilityButton';

const meta: Meta<typeof RecetaUtilityButton> = {
  title: 'Receta/RecetaUtilityButton',
  component: RecetaUtilityButton,
  ...recetaStoryMeta,
  tags: ['autodocs'],
  argTypes: {
    ...recetaStoryMeta.argTypes,
    variant: {
      control: 'radio',
      options: ['view', 'pdf'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecetaUtilityButton>;

export const View: Story = {
  args: { variant: 'view', theme: 'dark' },
};

export const Pdf: Story = {
  args: { variant: 'pdf', theme: 'dark' },
};

export const Disabled: Story = {
  args: { disabled: true, theme: 'dark' },
};

export const DarkMode: Story = {
  decorators: [recetaDarkDecorator],
  args: { variant: 'view', theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <RecetaUtilityButton {...args} size="sm" />
      <RecetaUtilityButton {...args} size="md" />
      <RecetaUtilityButton {...args} size="xl" />
    </div>
  ),
  args: { variant: 'view' },
};
