import type { Meta, StoryObj } from '@storybook/react';

import { NumberInput } from './NumberInput';

const meta: Meta<typeof NumberInput> = {
  title: 'Forms/NumberInput',
  component: NumberInput,
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
type Story = StoryObj<typeof NumberInput>;

export const Currency: Story = {
  args: {
    variant: 'currency',
    placeholder: '0',
    min: 0,
  },
};

export const Quantity: Story = {
  args: {
    variant: 'quantity',
    placeholder: '0.00',
    step: 0.1,
    min: 0,
  },
};

export const WithBounds: Story = {
  args: {
    min: 10,
    max: 20,
    defaultValue: '15',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '100',
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
    variant: 'currency',
    theme: 'dark',
  },
};
