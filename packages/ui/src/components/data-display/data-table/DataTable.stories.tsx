import type { Meta, StoryObj } from '@storybook/react';

import { DataTable } from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'Data Display/DataTable',
  component: DataTable,
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
type Story = StoryObj<typeof DataTable>;

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

const data = [
  { name: 'Item 1', status: 'Active' },
  { name: 'Item 2', status: 'Pending' },
];

export const Default: Story = {
  args: {
    columns,
    data,
  },
};

export const LoadingSkeleton: Story = {
  args: {
    columns,
    data: [],
    isLoading: true,
  },
};

export const EmptyState: Story = {
  args: {
    columns,
    data: [],
  },
};
