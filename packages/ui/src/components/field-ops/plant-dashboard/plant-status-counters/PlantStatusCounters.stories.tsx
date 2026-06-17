import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantStatusCounters } from './PlantStatusCounters';

const meta: Meta<typeof PlantStatusCounters> = {
  title: 'Field Ops/Plant Dashboard/PlantStatusCounters',
  component: PlantStatusCounters,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component: 'Contadores EN PROCESO, PAUSADAS, NOVEDADES y PENDIENTES del header.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantStatusCounters>;

export const Default: Story = {
  args: {
    counts: { inProgress: 1, paused: 1, incidents: 1, pending: 1 },
  },
};

export const LightMode: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
