import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NotificationButton from '.';

const meta: Meta<typeof NotificationButton> = {
  title: 'Atomos/NotificationButton',
  component: NotificationButton,
  tags: ['autodocs'],
  args: {
    variant: 'light',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationButton>;

export const Default: Story = {
  args: {
    variant: 'light',
    count: 3,
    icon: 'https://www.figma.com/api/mcp/asset/dc1445a7-d665-44fb-a51d-efb224fde504',
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    count: 3,
    icon: 'https://www.figma.com/api/mcp/asset/35f0c90d-e431-41b1-860b-43280c92aee5',
  },
};
