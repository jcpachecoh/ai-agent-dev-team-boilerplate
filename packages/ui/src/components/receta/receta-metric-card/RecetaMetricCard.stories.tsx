import type { Meta, StoryObj } from '@storybook/react';
import { Clock3, Flame, Layers } from 'lucide-react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaMetricCard } from './RecetaMetricCard';

const meta: Meta<typeof RecetaMetricCard> = {
  title: 'Receta/RecetaMetricCard',
  component: RecetaMetricCard,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RecetaMetricCard>;

export const Type1: Story = { args: { title: 'Total recetas', value: '7', variant: 'type-1' } };
export const Type2: Story = {
  args: { title: 'Tiempo promedio', value: '45m', variant: 'type-2', icon: <Clock3 /> },
};
export const Type3: Story = {
  args: { title: 'Categorías', value: '12', variant: 'type-3', icon: <Layers /> },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      <RecetaMetricCard {...args} title="Total recetas" value="7" variant="type-1" />
      <RecetaMetricCard {...args} title="Activas" value="5" variant="type-2" icon={<Flame />} />
      <RecetaMetricCard {...args} title="Categorías" value="12" variant="type-3" />
    </div>
  ),
};

export const Loading: Story = { args: { loading: true } };
export const DarkMode: Story = {
  decorators: [recetaDarkDecorator],
  args: { ...Type1.args, theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RecetaMetricCard {...args} size="sm" />
      <RecetaMetricCard {...args} size="md" />
      <RecetaMetricCard {...args} size="xl" />
    </div>
  ),
  args: Type1.args,
};
