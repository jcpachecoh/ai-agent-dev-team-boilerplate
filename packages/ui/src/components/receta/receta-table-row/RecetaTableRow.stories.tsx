import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaTableRow } from './RecetaTableRow';

const meta: Meta<typeof RecetaTableRow> = {
  title: 'Receta/RecetaTableRow',
  component: RecetaTableRow,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaTableRow>;

export const ActiveRow: Story = { args: { status: 'active' } };
export const InactiveRow: Story = {
  args: { status: 'inactive', code: 'RC-006', recipeName: 'Salsa de tamarindo' },
};
export const WithLongText: Story = {
  args: {
    recipeName: 'Costillas BBQ ahumadas con glaseado de panela y especias',
    category: 'Plato fuerte / Parrilla',
  },
};
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RecetaTableRow {...args} size="sm" />
      <RecetaTableRow {...args} size="md" />
      <RecetaTableRow {...args} size="xl" />
    </div>
  ),
};
