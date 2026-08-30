import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantDashboardHeader } from './PlantDashboardHeader';

const meta: Meta<typeof PlantDashboardHeader> = {
  title: 'Field Ops/Plant Dashboard/PlantDashboardHeader',
  component: PlantDashboardHeader,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component:
          'Header global del dashboard operario: marca, contadores agregados de estado, reloj, conectividad y botón salir.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantDashboardHeader>;

export const Default: Story = {
  args: {
    statusCounts: { inProgress: 1, paused: 1, incidents: 1, pending: 1, completed: 0 },
    operatorName: 'Carlos Mendoza',
    clockTime: '09:04 a. m.',
    clockSeconds: '09:04:44',
    isOnline: true,
  },
};

export const LightMode: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
