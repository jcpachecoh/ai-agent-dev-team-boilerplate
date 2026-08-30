import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import type { PlantAvailableOrder } from '../shared/plant-workstation-types';
import { PlantOrderAssignModal } from './PlantOrderAssignModal';

const orders: PlantAvailableOrder[] = [
  {
    orderId: 'OP-000012',
    productName: 'Pollo asado porcionado',
    recipeName: 'Receta Base Pollo',
    phaseName: 'Corte',
    phaseIndex: 2,
    phaseTotal: 4,
    stationId: 'EST-02',
    priority: 'urgent',
    status: 'in_progress',
    standardDurationMs: 900000,
    ingredients: [],
  },
  {
    orderId: 'OP-000013',
    productName: 'Costillas BBQ premium',
    recipeName: 'Receta Costilla Premium',
    phaseName: 'Marinado',
    phaseIndex: 1,
    phaseTotal: 3,
    stationId: 'EST-03',
    status: 'pending',
    standardDurationMs: 1200000,
    ingredients: [],
  },
];

const meta: Meta<typeof PlantOrderAssignModal> = {
  title: 'Field Ops/Plant Dashboard/PlantOrderAssignModal',
  component: PlantOrderAssignModal,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component: 'Modal para asignar una orden de producción a una celda del dashboard.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantOrderAssignModal>;

export const Default: Story = {
  args: {
    open: true,
    cellIndex: 0,
    orders,
    onClose: () => undefined,
    onSelectOrder: () => undefined,
  },
};

export const LightMode: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};

export const Empty: Story = {
  args: {
    open: true,
    cellIndex: 1,
    orders: [],
    onClose: () => undefined,
    onSelectOrder: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    open: true,
    cellIndex: 0,
    orders: [],
    isLoading: true,
    onClose: () => undefined,
    onSelectOrder: () => undefined,
  },
};

export const ErrorState: Story = {
  args: {
    open: true,
    cellIndex: 2,
    orders: [],
    errorMessage: 'No se pudieron cargar las órdenes.',
    onRetry: () => undefined,
    onClose: () => undefined,
    onSelectOrder: () => undefined,
  },
};
