import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaProgressIndicator } from './RecetaProgressIndicator';

const meta: Meta<typeof RecetaProgressIndicator> = {
  title: 'Receta/RecetaProgressIndicator',
  component: RecetaProgressIndicator,
  ...recetaStoryMeta,
  tags: ['autodocs'],
  argTypes: {
    ...recetaStoryMeta.argTypes,
    variant: {
      control: 'radio',
      options: ['success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecetaProgressIndicator>;

export const SuccessBarOnly: Story = {
  args: { value: 98, variant: 'success', showLabel: false, theme: 'dark' },
};

export const Danger: Story = {
  args: { value: 62, variant: 'danger', theme: 'dark' },
};

export const Warning: Story = {
  args: { value: 85, variant: 'warning', theme: 'dark' },
};

export const AllVariants: Story = {
  decorators: [recetaDarkDecorator],
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 160 }}>
      <RecetaProgressIndicator {...args} value={98} variant="success" showLabel={false} />
      <RecetaProgressIndicator {...args} value={62} variant="danger" />
      <RecetaProgressIndicator {...args} value={85} variant="warning" />
    </div>
  ),
  args: { theme: 'dark' },
};

export const DarkMode: Story = {
  decorators: [recetaDarkDecorator],
  args: { value: 85, variant: 'warning', theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
      <RecetaProgressIndicator {...args} size="sm" />
      <RecetaProgressIndicator {...args} size="md" />
      <RecetaProgressIndicator {...args} size="xl" />
    </div>
  ),
  args: { value: 85, variant: 'warning' },
};
