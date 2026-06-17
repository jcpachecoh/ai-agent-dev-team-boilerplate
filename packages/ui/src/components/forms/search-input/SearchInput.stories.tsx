import type { Meta, StoryObj } from '@storybook/react';

import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Forms/SearchInput',
  component: SearchInput,
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
      control: 'select',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
};

export const Loading: Story = {
  args: {
    placeholder: 'Searching...',
    loading: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Sample query',
  },
};

export const LightTheme: Story = {
  args: {
    theme: 'light',
    placeholder: 'Search in light theme...',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    theme: 'dark',
    placeholder: 'Search in dark mode...',
  },
};
