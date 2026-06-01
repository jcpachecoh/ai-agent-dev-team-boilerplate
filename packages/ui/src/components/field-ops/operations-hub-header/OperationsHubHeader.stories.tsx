import type { Meta, StoryObj } from '@storybook/react';

import { OperationsHubHeader } from './OperationsHubHeader';

const meta: Meta<typeof OperationsHubHeader> = {
  title: 'Field Ops/OperationsHubHeader',
  component: OperationsHubHeader,
  tags: ['autodocs'],
  args: {
    theme: 'dark',
    size: 'md',
    time: '14:22:26',
    dateLabel: 'miércoles, 27 de mayo de 2026',
  },
};

export default meta;

type Story = StoryObj<typeof OperationsHubHeader>;

export const Default: Story = {};

export const Offline: Story = {
  args: {
    isOnline: false,
    statusLabel: 'SISTEMA OFFLINE',
  },
};

export const Light: Story = {
  args: { theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ background: '#f2f0ea' }}>
        <Story />
      </div>
    ),
  ],
};
