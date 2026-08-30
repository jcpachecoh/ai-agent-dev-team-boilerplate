import type { Meta, StoryObj } from '@storybook/react';
import { Activity, AlertOctagon, CheckCircle2, Clock3 } from 'lucide-react';

import { OperationsStatCard } from './OperationsStatCard';

const meta: Meta<typeof OperationsStatCard> = {
  title: 'Field Ops/OperationsStatCard',
  component: OperationsStatCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#111' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    theme: 'dark',
    size: 'md',
    label: 'Estaciones activas',
    value: '5/6',
    iconColor: 'success',
    icon: <Activity aria-hidden />,
  },
};

export default meta;

type Story = StoryObj<typeof OperationsStatCard>;

export const Default: Story = {};

export const Alarms: Story = {
  args: {
    label: 'Alarmas activas',
    value: '4',
    icon: <AlertOctagon aria-hidden />,
    iconColor: 'danger',
    valueColor: 'danger',
  },
};

export const Orders: Story = {
  args: {
    label: 'Ordenes en curso',
    value: '6',
    icon: <Clock3 aria-hidden />,
    iconColor: 'warning',
    valueColor: 'warning',
  },
};

export const Completed: Story = {
  args: {
    label: 'Completadas hoy',
    value: '12',
    icon: <CheckCircle2 aria-hidden />,
    iconColor: 'success',
    valueColor: 'success',
  },
};

export const CustomColors: Story = {
  args: {
    label: 'Metrica custom',
    value: '99%',
    iconColor: '#8b5cf6',
    valueColor: '#f472b6',
    icon: <Activity aria-hidden />,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OperationsStatCard {...args} size="sm" />
      <OperationsStatCard {...args} size="md" />
      <OperationsStatCard {...args} size="xl" />
    </div>
  ),
};
