import type { Decorator } from '@storybook/react';
import React from 'react';

export const proveedorPaddedDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', maxWidth: 1200, width: '100%' }}>
    <Story />
  </div>
);

export const proveedorDarkDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', background: '#141414', maxWidth: 1200, width: '100%' }}>
    <Story />
  </div>
);

export const proveedorStoryMeta = {
  tags: ['autodocs'] as const,
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
  decorators: [proveedorPaddedDecorator],
};
