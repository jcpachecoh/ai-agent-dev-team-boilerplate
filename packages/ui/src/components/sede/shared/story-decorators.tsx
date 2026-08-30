import type { Decorator } from '@storybook/react';
import React from 'react';

import type { SedeTheme } from './sede-types';

const SEDE_LIGHT_PAGE = '#f6f4ef';
const SEDE_DARK_PAGE = '#0a0a0a';

/** Canvas background follows the `theme` control — avoids stacking dark + light decorators. */
export const sedeThemeDecorator: Decorator = (Story, { args }) => {
  const theme = (args.theme as SedeTheme | undefined) ?? 'light';
  const background = theme === 'dark' ? SEDE_DARK_PAGE : SEDE_LIGHT_PAGE;

  return (
    <div
      style={{
        padding: '1.75rem',
        background,
        maxWidth: 1240,
        width: '100%',
        minHeight: 120,
        boxSizing: 'border-box',
      }}
    >
      <Story />
    </div>
  );
};

export const sedeStoryMeta = {
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
  decorators: [sedeThemeDecorator],
};
