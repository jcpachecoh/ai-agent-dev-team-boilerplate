import type { Meta, StoryObj } from '@storybook/react';
import { Upload } from 'lucide-react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaActionButton } from './RecetaActionButton';

const meta: Meta<typeof RecetaActionButton> = {
  title: 'Receta/RecetaActionButton',
  component: RecetaActionButton,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaActionButton>;

export const Default: Story = { args: {} };
export const WithIcon: Story = { args: { label: 'Importar receta', icon: <Upload /> } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <RecetaActionButton {...args} size="sm" />
      <RecetaActionButton {...args} size="md" />
      <RecetaActionButton {...args} size="xl" />
    </div>
  ),
};
