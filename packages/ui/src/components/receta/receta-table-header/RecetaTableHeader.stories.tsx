import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaTableHeader } from './RecetaTableHeader';

const meta: Meta<typeof RecetaTableHeader> = {
  title: 'Receta/RecetaTableHeader',
  component: RecetaTableHeader,
  ...recetaStoryMeta,
  args: {
    ...recetaStoryMeta.args,
    size: 'xl',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaTableHeader>;

export const Default: Story = { args: {} };
export const ManyColumns: Story = {
  args: {
    columns: [
      { key: 'id', label: 'Código', width: '100px' },
      { key: 'recipe', label: 'Receta', width: '220px' },
      { key: 'owner', label: 'Responsable', width: '160px' },
      { key: 'date', label: 'Actualizada', width: '150px' },
      { key: 'time', label: 'Tiempo', width: '120px' },
      { key: 'status', label: 'Estado', width: '120px' },
    ],
  },
};
export const DarkMode: Story = {
  decorators: [recetaDarkDecorator],
  args: { theme: 'dark', size: 'xl' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RecetaTableHeader {...args} size="sm" />
      <RecetaTableHeader {...args} size="md" />
      <RecetaTableHeader {...args} size="xl" />
    </div>
  ),
};
