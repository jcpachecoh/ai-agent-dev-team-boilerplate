import type { Decorator } from '@storybook/react';
import React from 'react';

import type { UsuarioTheme } from './usuario-types';

const USUARIO_LIGHT_PAGE = '#f6f4ef';
const USUARIO_DARK_PAGE = '#0a0a0a';

export const usuarioThemeDecorator: Decorator = (Story, { args }) => {
  const theme = (args.theme as UsuarioTheme | undefined) ?? 'dark';
  const background = theme === 'dark' ? USUARIO_DARK_PAGE : USUARIO_LIGHT_PAGE;

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

export const usuarioStoryMeta = {
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
      options: ['sm', 'md'],
    },
  },
  decorators: [usuarioThemeDecorator],
};
