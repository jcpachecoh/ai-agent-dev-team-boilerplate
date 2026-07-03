import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaTextInput } from './RecetaTextInput';

const meta: Meta<typeof RecetaTextInput> = {
  title: 'Receta/RecetaTextInput',
  component: RecetaTextInput,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  args: {
    theme: 'dark',
    placeholder: 'Ej: Marinado y Reposo',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof RecetaTextInput>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: 'Marinado y Reposo',
    readOnly: true,
  },
};
