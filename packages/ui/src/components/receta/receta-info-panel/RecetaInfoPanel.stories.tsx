import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaInfoPanel } from './RecetaInfoPanel';

const meta: Meta<typeof RecetaInfoPanel> = {
  title: 'Receta/RecetaInfoPanel',
  component: RecetaInfoPanel,
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
type Story = StoryObj<typeof RecetaInfoPanel>;

export const Default: Story = {};

export const WithCategory: Story = {
  args: {
    categoryValue: 'Plato Fuerte',
    yieldValue: '4 porciones',
  },
};
