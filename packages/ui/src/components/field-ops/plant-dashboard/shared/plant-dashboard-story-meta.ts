import React from 'react';
import type { Decorator } from '@storybook/react';

export const plantDashboardThemeDecorator: Decorator = (Story, context) => {
  const theme = (context.args.theme as 'light' | 'dark' | undefined) ?? 'dark';
  const background = theme === 'light' ? '#f2f0ea' : '#0a0a0a';

  return React.createElement(
    'div',
    {
      style: {
        padding: '2rem',
        background,
        minHeight: 360,
        width: '100%',
        maxWidth: 760,
        boxSizing: 'border-box',
      },
    },
    React.createElement(Story),
  );
};

export const plantDashboardStoryMeta = {
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
  decorators: [plantDashboardThemeDecorator],
  parameters: {
    docs: {
      description: {
        component:
          'Componentes del dashboard multi-estación de Plant KDS. Usar `theme="dark"` en producción; `light` disponible para revisión en Storybook.',
      },
    },
  },
};
