import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import type { PlantWorkstationSnapshot } from '../shared/plant-workstation-types';
import { PlantWorkstationCard } from './PlantWorkstationCard';

const pausedSnapshot: PlantWorkstationSnapshot = {
  orderId: 'OP-000014',
  productName: 'Chicharrón prensado',
  recipeName: 'Receta Chicharrón Casa',
  phaseName: 'Cocción inicial',
  phaseIndex: 2,
  phaseTotal: 3,
  stationId: 'EST-04',
  operatorName: 'Pedro Torres',
  standardDurationMs: 15 * 60 * 1000,
  ingredients: [
    { id: '1', name: 'Aceite vegetal', quantity: '10 L' },
    { id: '2', name: 'Sal', quantity: '1 kg' },
    { id: '3', name: 'Freidora industrial', quantity: '1 und' },
  ],
};

const inProgressSnapshot: PlantWorkstationSnapshot = {
  orderId: 'OP-000012',
  productName: 'Pollo asado porcionado',
  recipeName: 'Receta Base Pollo',
  phaseName: 'Corte y porcionado',
  phaseIndex: 2,
  phaseTotal: 4,
  stationId: 'EST-02',
  priority: 'urgent',
  operatorName: 'Carlos Mendoza',
  standardDurationMs: 15 * 60 * 1000,
  ingredients: [
    { id: '1', name: 'Aceite vegetal', quantity: '10 L' },
    { id: '2', name: 'Sal', quantity: '1 kg' },
  ],
};

const meta: Meta<typeof PlantWorkstationCard> = {
  title: 'Field Ops/Plant Dashboard/PlantWorkstationCard',
  component: PlantWorkstationCard,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component:
          'Tarjeta de estación con OP asignada. Soporta densidad `full` (1×1) y `compact` (1×2 / 2×2), estados pending / in_progress / paused / incident, y tabs Proceso / Novedades.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantWorkstationCard>;

export const CompactPaused: Story = {
  args: {
    status: 'paused',
    snapshot: pausedSnapshot,
    density: 'compact',
    elapsedMs: 8 * 60 * 1000 + 26 * 1000,
    timerRunning: false,
  },
};

export const FullInProgress: Story = {
  args: {
    status: 'in_progress',
    snapshot: inProgressSnapshot,
    density: 'full',
    elapsedMs: 14 * 60 * 1000 + 37 * 1000,
    timerRunning: true,
  },
};

export const LightMode: Story = {
  args: {
    ...FullInProgress.args,
    theme: 'light',
  },
};
