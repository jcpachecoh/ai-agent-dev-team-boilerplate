import type { Meta, StoryObj } from '@storybook/react';

import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
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
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  args: {
    placeholder: 'Select a date',
  },
};

export const LightTheme: Story = {
  args: {
    theme: 'light',
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
      <div className="dark" style={{ padding: '2rem', background: '#111', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    theme: 'dark',
  },
};
