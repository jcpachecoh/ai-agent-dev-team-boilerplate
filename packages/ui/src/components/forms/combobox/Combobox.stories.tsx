import type { Meta, StoryObj } from '@storybook/react';

import { Combobox } from './Combobox';

const meta: Meta<typeof Combobox> = {
  title: 'Forms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  args: {
    theme: 'light',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'xl'],
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const options = Array.from({ length: 1000 }, (_, i) => ({
  value: `item-${i}`,
  label: `Item ${i}`,
}));

export const Default: Story = {
  args: {
    options: options.slice(0, 10),
    placeholder: 'Select an item',
  },
};

export const MultiSelect: Story = {
  args: {
    options: options.slice(0, 10),
    multiple: true,
    placeholder: 'Select items',
  },
};

export const Virtualized: Story = {
  args: {
    options,
    placeholder: 'Select from 1000 items',
  },
};

export const Loading: Story = {
  args: {
    options: [],
    loading: true,
    placeholder: 'Searching...',
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    options: options.slice(0, 10),
    theme: 'dark',
  },
};
