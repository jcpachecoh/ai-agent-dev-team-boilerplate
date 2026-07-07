import type { Meta, StoryObj } from '@storybook/react';
import { Activity, AlertOctagon, CheckCircle2, Clock3 } from 'lucide-react';

import { OperationsStatCard } from '../operations-stat-card';
import { OperationsStatsBar } from './OperationsStatsBar';

const meta: Meta<typeof OperationsStatsBar> = {
  title: 'Field Ops/OperationsStatsBar',
  component: OperationsStatsBar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#111', maxWidth: 1200 }}>
        <Story />
      </div>
    ),
  ],
  args: { theme: 'dark', size: 'md' },
};

export default meta;

type Story = StoryObj<typeof OperationsStatsBar>;

export const Default: Story = {
  render: (args) => (
    <OperationsStatsBar {...args}>
      <OperationsStatCard
        label="Estaciones activas"
        value="5/6"
        icon={<Activity aria-hidden />}
        iconColor="success"
        valueColor="success"
        theme={args.theme}
        size={args.size}
      />
      <OperationsStatCard
        label="Alarmas activas"
        value="4"
        icon={<AlertOctagon aria-hidden />}
        iconColor="danger"
        valueColor="danger"
        theme={args.theme}
        size={args.size}
      />
      <OperationsStatCard
        label="Ordenes en curso"
        value="6"
        icon={<Clock3 aria-hidden />}
        iconColor="warning"
        valueColor="warning"
        theme={args.theme}
        size={args.size}
      />
      <OperationsStatCard
        label="Completadas hoy"
        value="12"
        icon={<CheckCircle2 aria-hidden />}
        iconColor="success"
        valueColor="success"
        theme={args.theme}
        size={args.size}
      />
    </OperationsStatsBar>
  ),
};
