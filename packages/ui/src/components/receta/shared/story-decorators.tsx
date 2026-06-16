import type { Decorator } from '@storybook/react';
import React from 'react';

export const recetaPaddedDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', maxWidth: 960, width: '100%' }}>
    <Story />
  </div>
);

export const recetaDarkDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', background: '#141414', maxWidth: 960, width: '100%' }}>
    <Story />
  </div>
);

export const recetaStoryMeta = {
  tags: ['autodocs'],
  args: {
    theme: 'light' as const,
    size: 'md' as const,
  },
  argTypes: {
    theme: {
      control: 'radio' as const,
      options: ['light', 'dark'],
    },
    size: {
      control: 'select' as const,
      options: ['sm', 'md', 'xl'],
    },
  },
  decorators: [recetaPaddedDecorator],
};
