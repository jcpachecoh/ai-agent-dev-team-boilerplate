import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantOrderNoveltiesList } from './PlantOrderNoveltiesList';

const meta: Meta<typeof PlantOrderNoveltiesList> = {
  title: 'Field Ops/Plant Dashboard/PlantOrderNoveltiesList',
  component: PlantOrderNoveltiesList,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlantOrderNoveltiesList>;

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const Loading: Story = {
  args: {
    items: [],
    loading: true,
  },
};

export const WithItems: Story = {
  args: {
    items: [
      {
        id: 'n-1',
        noveltyType: 'EQUIPMENT_FAILURE',
        severity: 'HIGH',
        description: 'Falla en mezcladora principal — vibración anormal.',
        createdAt: '2026-06-30T14:22:00.000Z',
        requiresPause: true,
      },
      {
        id: 'n-2',
        noveltyType: 'INGREDIENT_SHORTAGE',
        severity: 'MEDIUM',
        description: 'Faltante de sal refinada en línea 2.',
        createdAt: '2026-06-30T12:05:00.000Z',
        resolvedAt: '2026-06-30T13:10:00.000Z',
      },
      {
        id: 'n-3',
        noveltyType: 'OTHER',
        severity: 'LOW',
        description: 'Observación menor en etiquetado.',
        createdAt: '2026-06-30T09:40:00.000Z',
      },
    ],
  },
};
