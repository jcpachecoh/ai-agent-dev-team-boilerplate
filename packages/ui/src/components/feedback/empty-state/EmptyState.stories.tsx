import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from './EmptyState';
import { Button } from '../../Button';

const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['search', 'create', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Search: Story = {
  args: {
    variant: 'search',
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you are looking for.',
    action: <Button variant="secondary">Clear filters</Button>,
  },
};

export const Create: Story = {
  args: {
    variant: 'create',
    title: 'No items yet',
    description: 'Start by creating your first item. It only takes a few seconds.',
    action: <Button variant="primary">Create Item</Button>,
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Something went wrong',
    description: 'We encountered an error while loading the data. Please try again later.',
    action: <Button variant="danger">Retry</Button>,
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    theme: 'dark',
    variant: 'search',
    title: 'Dark Mode Empty State',
    description: 'This is how the empty state looks in dark mode.',
  },
};
