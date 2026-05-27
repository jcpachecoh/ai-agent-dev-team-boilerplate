import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaFormButton } from './RecetaFormButton';

const meta: Meta<typeof RecetaFormButton> = {
  title: 'Receta/RecetaFormButton',
  component: RecetaFormButton,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  args: {
    theme: 'dark',
    variant: 'save',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
    variant: {
      control: 'select',
      options: ['save', 'discard', 'add', 'cancel'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof RecetaFormButton>;

export const Save: Story = {};

export const Discard: Story = {
  args: { variant: 'discard' },
};

export const Add: Story = {
  args: { variant: 'add' },
};

export const Cancel: Story = {
  args: { variant: 'cancel' },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <RecetaFormButton {...args} variant="save" />
      <RecetaFormButton {...args} variant="discard" />
      <RecetaFormButton {...args} variant="add" />
      <RecetaFormButton {...args} variant="cancel" />
    </div>
  ),
};
