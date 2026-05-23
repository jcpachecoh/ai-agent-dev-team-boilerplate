import type { Decorator } from '@storybook/react';
import React from 'react';

export const lightBackground = {
  parameters: { backgrounds: { default: 'light' } },
};

export const darkBackground = {
  parameters: { backgrounds: { default: 'dark' } },
};

export const lightCanvasDecorator: Decorator = (Story) => (
  <div style={{ padding: 24 }}>
    <Story />
  </div>
);

export const darkCanvasDecorator: Decorator = (Story) => (
  <div style={{ padding: 24 }}>
    <Story />
  </div>
);

export function themeComparison<P extends { theme?: 'light' | 'dark'; variant?: 'light' | 'dark' }>(
  Component: React.ComponentType<P>,
  prop: 'theme' | 'variant' = 'theme',
) {
  return (args: P) => (
    <div
      style={{ display: 'flex', gap: 24, padding: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}
    >
      <Component {...args} {...({ [prop]: 'light' } as P)} />
      <Component {...args} {...({ [prop]: 'dark' } as P)} />
    </div>
  );
}
