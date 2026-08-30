import type { Meta, StoryObj } from '@storybook/react';

import { NominaKpiGrid } from './NominaKpiGrid';
import { NOMINA_DEMO_KPI_METRICS } from '../shared/nomina-demo-data';

const meta: Meta<typeof NominaKpiGrid> = {
  title: 'Nomina/NominaKpiGrid',
  component: NominaKpiGrid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaKpiGrid>;

export const GridDark: Story = {
  args: {
    theme: 'dark',
    metrics: NOMINA_DEMO_KPI_METRICS,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const GridLight: Story = {
  ...GridDark,
  args: { ...GridDark.args, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef' }}>
        <Story />
      </div>
    ),
  ],
};
