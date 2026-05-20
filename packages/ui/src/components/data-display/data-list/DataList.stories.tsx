import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DataList } from './DataList';
import { StatusBadge } from '../status-badge';

const meta: Meta<typeof DataList> = {
  title: 'Data Display/DataList',
  component: DataList,
  tags: ['autodocs'],
  args: {
    theme: 'light',
    size: 'md',
  },
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataList>;

const items = [
  { label: 'Supplier Name', value: 'RestOpsIQ' },
  { label: 'Status', value: <StatusBadge theme="light" status="ACTIVE" /> },
  { label: 'Address', value: 'Calle 100 # 15-50, Bogotá', span: 2 as const },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const OneColumn: Story = {
  args: {
    items,
    columns: 1,
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111', width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items,
    theme: 'dark',
  },
};
