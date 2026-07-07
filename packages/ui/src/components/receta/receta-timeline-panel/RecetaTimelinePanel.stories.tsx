import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaTimelinePanel } from './RecetaTimelinePanel';

const meta: Meta<typeof RecetaTimelinePanel> = {
  title: 'Receta/RecetaTimelinePanel',
  component: RecetaTimelinePanel,
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
type Story = StoryObj<typeof RecetaTimelinePanel>;

export const Default: Story = {};

export const CustomSteps: Story = {
  args: {
    items: [
      { label: 'Mise en place', duration: '10 min' },
      { label: 'Sellado', duration: '12 min' },
      { label: 'Reposo', duration: '8 min' },
    ],
  },
};
