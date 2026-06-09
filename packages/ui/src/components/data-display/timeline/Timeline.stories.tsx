import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import React from 'react';

import { Timeline } from './Timeline';

const meta: Meta<typeof Timeline> = {
  title: 'Data Display/Timeline',
  component: Timeline,
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
type Story = StoryObj<typeof Timeline>;

const items = [
  {
    timestamp: '2026-05-20T10:00:00',
    title: 'Order placed',
    description: 'Purchase order PO-1234 was created.',
    color: 'info' as const,
  },
  {
    timestamp: '2026-05-19T14:30:00',
    title: 'Approved',
    description: 'Approved by operations manager.',
    color: 'success' as const,
  },
  {
    timestamp: '2026-05-18T09:15:00',
    title: 'Draft saved',
    description: 'Initial draft saved by buyer.',
    color: 'default' as const,
  },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        timestamp: '2026-05-20T16:00:00',
        title: 'Delivered',
        description: 'Shipment received at warehouse.',
        icon: <CheckCircle2 size={16} />,
        color: 'success',
      },
      {
        timestamp: '2026-05-20T12:00:00',
        title: 'In transit',
        description: 'Driver en route to destination.',
        icon: <Truck size={16} />,
        color: 'info',
      },
      {
        timestamp: '2026-05-20T08:00:00',
        title: 'Packed',
        description: 'Items packed and ready for dispatch.',
        icon: <Package size={16} />,
        color: 'gold',
      },
    ],
  },
};

export const ManyItemsCollapsed: Story = {
  args: {
    items: [...items, ...items, ...items],
    collapsible: true,
    collapsedCount: 3,
  },
};

export const Expanded: Story = {
  args: {
    items: [...items, ...items],
    collapsible: true,
    defaultExpanded: true,
    collapsedCount: 2,
  },
};

export const BusinessEvents: Story = {
  args: {
    items: [
      {
        timestamp: '2026-05-20T18:45:00',
        title: 'Payment confirmed',
        description: 'Invoice INV-9081 marked as paid.',
        color: 'success',
      },
      {
        timestamp: '2026-05-20T11:20:00',
        title: 'Dispatch scheduled',
        description: 'Route assigned to fleet unit FL-22.',
        color: 'info',
      },
      {
        timestamp: '2026-05-19T17:05:00',
        title: 'Inventory adjusted',
        description: 'Stock corrected after cycle count.',
        color: 'warning',
      },
      {
        timestamp: '2026-05-19T08:00:00',
        title: 'Audit log entry',
        description: 'User updated supplier lead time.',
        color: 'default',
      },
    ],
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111', maxWidth: '480px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items,
    theme: 'dark',
  },
};
