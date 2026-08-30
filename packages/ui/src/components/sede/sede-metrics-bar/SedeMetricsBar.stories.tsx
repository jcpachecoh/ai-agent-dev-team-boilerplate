import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeMetricsBar } from './SedeMetricsBar';
import { SedeMetricChip } from '../sede-metric-chip';

const meta: Meta<typeof SedeMetricsBar> = {
  title: 'Sede/SedeMetricsBar',
  component: SedeMetricsBar,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeMetricsBar>;

export const Default: Story = {
  render: (args) => (
    <SedeMetricsBar {...args}>
      <SedeMetricChip theme={args.theme} label="Total sedes" value={10} valueColor="primary" />
      <SedeMetricChip theme={args.theme} label="Activas" value={7} valueColor="success" />
      <SedeMetricChip theme={args.theme} label="Inactivas" value={3} valueColor="muted" />
    </SedeMetricsBar>
  ),
};
