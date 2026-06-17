import type { Decorator } from '@storybook/react';
import React from 'react';

export const paddedContainerDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', maxWidth: 640, width: '100%' }}>
    <Story />
  </div>
);

export const darkModeDecorator: Decorator = (Story) => (
  <div
    className="dark"
    style={{ padding: '2rem', background: '#0d0d0d', maxWidth: 640, width: '100%' }}
  >
    <Story />
  </div>
);

export const fieldOpsStoryMeta = {
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
  decorators: [paddedContainerDecorator],
};
