import type { Meta, StoryObj } from '@storybook/react';
import { Clock3 } from 'lucide-react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaNavItem } from './RecetaNavItem';

const meta: Meta<typeof RecetaNavItem> = {
  title: 'Receta/RecetaNavItem',
  component: RecetaNavItem,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaNavItem>;

export const Active: Story = { args: { active: true } };
export const Inactive: Story = { args: { active: false } };
export const WithIcon: Story = { args: { label: 'Historial', icon: <Clock3 /> } };
export const DarkMode: Story = {
  decorators: [recetaDarkDecorator],
  args: { theme: 'dark', active: true },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <RecetaNavItem {...args} size="sm" />
      <RecetaNavItem {...args} size="md" />
      <RecetaNavItem {...args} size="xl" />
    </div>
  ),
  args: { active: true },
};
