import type { Meta, StoryObj } from '@storybook/react';

import { AsistenciaLocationHub } from './AsistenciaLocationHub';

const meta: Meta<typeof AsistenciaLocationHub> = {
  title: 'Asistencia/AsistenciaLocationHub',
  component: AsistenciaLocationHub,
};

export default meta;

type Story = StoryObj<typeof AsistenciaLocationHub>;

const locations = [
  {
    id: 'loc-1',
    name: 'Chapinero',
    city: 'Bogotá',
    metrics: { total: 12, onShift: 8, absent: 2, lateArrivals: 1, overtime: 3 },
  },
  {
    id: 'loc-2',
    name: 'Usaquén',
    city: 'Bogotá',
    metrics: { total: 9, onShift: 6, absent: 1, lateArrivals: 0, overtime: 2 },
  },
];

export const List: Story = {
  args: {
    locations,
    viewMode: 'list',
    live: true,
    onSync: () => undefined,
  },
};

export const Grid: Story = {
  args: {
    locations,
    viewMode: 'grid',
    live: true,
    onSync: () => undefined,
  },
};
