import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaStepCard } from './RecetaStepCard';

const meta: Meta<typeof RecetaStepCard> = {
  title: 'Receta/RecetaStepCard',
  component: RecetaStepCard,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  args: {
    theme: 'dark',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof RecetaStepCard>;

export const Default: Story = {};

export const NotSelected: Story = {
  args: {
    selected: false,
    stepNumber: 2,
    title: 'Marinado',
    description: 'Cubrir la proteína y dejar reposar antes de pasar a cocción',
    duration: '30 min',
  },
};
