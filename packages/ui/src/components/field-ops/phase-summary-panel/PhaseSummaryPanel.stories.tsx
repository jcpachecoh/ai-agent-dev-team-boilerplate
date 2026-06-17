import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PhaseSummaryPanel } from './PhaseSummaryPanel';

const demoRows = [
  { id: 'phase', label: 'Fase', value: '2 de 4' },
  { id: 'op', label: 'OP', value: 'OP-000012' },
  { id: 'time', label: 'Tiempo', value: '15:28', tone: 'gold' as const },
  { id: 'target', label: 'Meta', value: '50.0 kg' },
  { id: 'actual', label: 'Real', value: '48.5 kg', tone: 'success' as const },
];

const meta: Meta<typeof PhaseSummaryPanel> = {
  title: 'Field Ops/PhaseSummaryPanel',
  component: PhaseSummaryPanel,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PhaseSummaryPanel>;

export const Default: Story = {
  args: { rows: demoRows },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { rows: demoRows, theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}
    >
      <PhaseSummaryPanel {...args} size="sm" />
      <PhaseSummaryPanel {...args} size="md" />
      <PhaseSummaryPanel {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

export const Loading: Story = {
  args: { rows: [], loading: true },
};
