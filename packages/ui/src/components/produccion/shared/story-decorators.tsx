import type { Decorator, Meta } from '@storybook/react';
import React from 'react';

import type { ProduccionTheme } from './produccion-types';

const PRODUCCION_LIGHT_CANVAS = '#f6f4ef';
const PRODUCCION_DARK_CANVAS = '#0a0a0a';

function resolveProduccionTheme(context: { args?: { theme?: ProduccionTheme } }): ProduccionTheme {
  return context.args?.theme ?? 'dark';
}

export const produccionThemeDecorator: Decorator = (Story, context) => {
  const theme = resolveProduccionTheme(context);
  const background = theme === 'light' ? PRODUCCION_LIGHT_CANVAS : PRODUCCION_DARK_CANVAS;
  return (
    <div style={{ padding: '2rem', background, maxWidth: 1248, width: '100%' }}>
      <Story />
    </div>
  );
};

export const produccionDarkDecorator: Decorator = (Story) => (
  <div
    style={{ padding: '2rem', background: PRODUCCION_DARK_CANVAS, maxWidth: 1248, width: '100%' }}
  >
    <Story />
  </div>
);

export const produccionLightDecorator: Decorator = (Story) => (
  <div
    style={{ padding: '2rem', background: PRODUCCION_LIGHT_CANVAS, maxWidth: 1248, width: '100%' }}
  >
    <Story />
  </div>
);

export const produccionScreenDecorator: Decorator = (Story, context) => {
  const theme = resolveProduccionTheme(context);
  const background = theme === 'light' ? PRODUCCION_LIGHT_CANVAS : PRODUCCION_DARK_CANVAS;
  return (
    <div style={{ background, maxWidth: 1248, width: '100%' }}>
      <Story />
    </div>
  );
};

type ProduccionStoryMetaSlice = Pick<Meta, 'tags' | 'args' | 'argTypes' | 'decorators'>;

export const produccionStoryMeta: ProduccionStoryMetaSlice = {
  tags: ['autodocs'],
  args: { theme: 'dark' as const, size: 'md' as const },
  argTypes: {
    theme: { control: 'radio' as const, options: ['light', 'dark'] },
    size: { control: 'select' as const, options: ['sm', 'md', 'xl'] },
  },
  decorators: [produccionThemeDecorator],
};
