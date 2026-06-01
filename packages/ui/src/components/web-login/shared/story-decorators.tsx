import type { Decorator } from '@storybook/react';
import React from 'react';

export const webLoginPaddedDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', maxWidth: 1200, width: '100%' }}>
    <Story />
  </div>
);

export const webLoginDarkDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', background: '#0a0a0a', maxWidth: 1200, width: '100%' }}>
    <Story />
  </div>
);

export const webLoginLightDecorator: Decorator = (Story) => (
  <div style={{ padding: '2rem', background: '#f6f4ef', maxWidth: 1200, width: '100%' }}>
    <Story />
  </div>
);

export const webLoginFullscreenDecorator: Decorator = (Story) => (
  <div style={{ minHeight: '100vh' }}>
    <Story />
  </div>
);

export const webLoginStoryMeta = {
  tags: ['autodocs'] as const,
  args: {
    theme: 'dark' as const,
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
  decorators: [webLoginPaddedDecorator],
};

export const webLoginPageStoryMeta = {
  ...webLoginStoryMeta,
  parameters: {
    layout: 'fullscreen' as const,
  },
  decorators: [webLoginFullscreenDecorator],
};
