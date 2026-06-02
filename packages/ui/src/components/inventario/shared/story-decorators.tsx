import type { Decorator, Meta } from '@storybook/react';
import React from 'react';

import type { InventarioTheme } from './inventario-types';

const INVENTARIO_LIGHT_CANVAS = '#f6f4ef';
const INVENTARIO_DARK_CANVAS = '#0a0a0a';

function resolveInventarioTheme(context: { args?: { theme?: InventarioTheme } }): InventarioTheme {
  return context.args?.theme ?? 'light';
}

/** Canvas background follows the `theme` control (light | dark). */
export const inventarioThemeDecorator: Decorator = (Story, context) => {
  const theme = resolveInventarioTheme(context);
  const background = theme === 'light' ? INVENTARIO_LIGHT_CANVAS : INVENTARIO_DARK_CANVAS;

  return (
    <div style={{ padding: '2rem', background, maxWidth: 1200, width: '100%' }}>
      <Story />
    </div>
  );
};

export const inventarioPaddedDecorator = inventarioThemeDecorator;

export const inventarioDarkDecorator: Decorator = (Story) => (
  <div
    style={{ padding: '2rem', background: INVENTARIO_DARK_CANVAS, maxWidth: 1200, width: '100%' }}
  >
    <Story />
  </div>
);

export const inventarioLightDecorator: Decorator = (Story) => (
  <div
    style={{ padding: '2rem', background: INVENTARIO_LIGHT_CANVAS, maxWidth: 1200, width: '100%' }}
  >
    <Story />
  </div>
);

export const inventarioDashboardDecorator: Decorator = (Story, context) => {
  const theme = resolveInventarioTheme(context);
  const background = theme === 'light' ? INVENTARIO_LIGHT_CANVAS : INVENTARIO_DARK_CANVAS;

  return (
    <div style={{ background, maxWidth: 1232, width: '100%' }}>
      <Story />
    </div>
  );
};

type InventarioStoryMetaSlice = Pick<Meta, 'tags' | 'args' | 'argTypes' | 'decorators'>;

/** Shared Storybook meta for Inventario components (theme, size, autodocs). */
export const inventarioStoryMeta: InventarioStoryMetaSlice = {
  tags: ['autodocs'],
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
  decorators: [inventarioThemeDecorator],
};
