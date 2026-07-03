import type { Meta, StoryObj } from '@storybook/react';

import { FileUpload } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Forms/FileUpload',
  component: FileUpload,
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
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {
    accept: 'image/*',
    description: 'Images only (PNG, JPG)',
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
  },
};

export const WithProgress: Story = {
  args: {
    progress: 45,
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
  },
};
