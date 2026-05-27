import type { Decorator } from '@storybook/react';
import React from 'react';

export const lightCanvas: Decorator = (Story) => (
  <div style={{ padding: 24, background: '#f8f6f1' }}>
    <Story />
  </div>
);

export const darkCanvas: Decorator = (Story) => (
  <div style={{ padding: 24, background: '#111111' }}>
    <Story />
  </div>
);

/** Syncs preview background with `theme` arg (light | dark) for autodocs controls. */
export const themeCanvas: Decorator = (Story, { args }) => {
  const theme = (args as { theme?: 'light' | 'dark' }).theme ?? 'light';
  const background = theme === 'dark' ? '#111111' : '#f8f6f1';
  return (
    <div style={{ padding: 24, background }}>
      <Story />
    </div>
  );
};

/** Syncs preview background with `variant` (and global `theme`) for autodocs controls. */
export const variantCanvas: Decorator = (Story, { args }) => {
  const a = args as { variant?: 'light' | 'dark'; theme?: 'light' | 'dark' };
  const variant = a.variant ?? a.theme ?? 'light';
  const background = variant === 'dark' ? '#111111' : '#f8f6f1';
  return (
    <div style={{ padding: 24, background }}>
      <Story />
    </div>
  );
};
