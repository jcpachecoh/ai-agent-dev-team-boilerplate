import type { Decorator } from '@storybook/react';
import React from 'react';

import type { EmpresaTheme } from './empresa-types';

const EMPRESA_LIGHT_PAGE = '#f6f4ef';
const EMPRESA_DARK_PAGE = '#0a0a0a';

export const empresaThemeDecorator: Decorator = (Story, { args }) => {
  const theme = (args.theme as EmpresaTheme | undefined) ?? 'dark';
  const background = theme === 'dark' ? EMPRESA_DARK_PAGE : EMPRESA_LIGHT_PAGE;

  return (
    <div
      style={{
        padding: '1.75rem',
        background,
        maxWidth: 960,
        width: '100%',
        minHeight: 120,
        boxSizing: 'border-box',
      }}
    >
      <Story />
    </div>
  );
};

export const empresaStoryMeta = {
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
  decorators: [empresaThemeDecorator],
};
