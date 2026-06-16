import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaSearch } from './RecetaSearch';

const meta: Meta<typeof RecetaSearch> = {
  title: 'Receta/RecetaSearch',
  component: RecetaSearch,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RecetaSearch>;

export const Default: Story = { args: {} };
export const WithValue: Story = { args: { value: 'Costillas' } };
export const Clearable: Story = { args: { value: 'Lomo' } };
export const Disabled: Story = { args: { disabled: true, value: 'Deshabilitado' } };
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RecetaSearch {...args} size="sm" />
      <RecetaSearch {...args} size="md" />
      <RecetaSearch {...args} size="xl" />
    </div>
  ),
};
