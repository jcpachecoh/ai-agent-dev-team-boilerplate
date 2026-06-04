import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './Alert';
import { Button } from '../../Button';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    mode: {
      control: 'select',
      options: ['inline', 'banner'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your changes have been saved successfully.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'There was an error processing your request.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Your subscription will expire in 3 days.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'A new software update is available.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'info',
    title: 'Dismissible Alert',
    children: 'You can close this alert by clicking the X button.',
    dismissible: true,
  },
};

export const WithAction: Story = {
  args: {
    variant: 'warning',
    title: 'Action Required',
    children: 'Please verify your email address to continue.',
    action: (
      <Button size="small" variant="primary">
        Verify
      </Button>
    ),
  },
};

export const Banner: Story = {
  args: {
    variant: 'info',
    mode: 'banner',
    children: 'Maintenance scheduled for tonight at 10 PM EST.',
    dismissible: true,
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
    variant: 'success',
    title: 'Dark Mode Success',
    children: 'The dark mode implementation looks great.',
  },
};
