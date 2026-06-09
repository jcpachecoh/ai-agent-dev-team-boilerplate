import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPlantStationCard } from './ProduccionPlantStationCard';

const meta: Meta<typeof ProduccionPlantStationCard> = {
  title: 'Produccion/ProduccionPlantStationCard',
  component: ProduccionPlantStationCard,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.plantStationCard),
};
export default meta;
type Story = StoryObj<typeof ProduccionPlantStationCard>;

export const Normal: Story = {};

export const Warning: Story = {
  args: {
    code: 'EST-02',
    name: 'Corte y Deshuese',
    subtitle: 'Fileteado y porcionado',
    orderNumber: 'OP-000013',
    productName: 'Costillas BBQ',
    priority: 'alta',
    quantityLabel: '30 kg',
    phaseLabel: 'Fase 2/4',
    progress: 99,
    efficiencyStatus: 'warning',
    timerLabel: '14:49',
    severity: 'medio',
    operators: [
      { initials: 'PT', tone: 'teal' },
      { initials: 'JG', tone: 'info' },
    ],
    operatorCountLabel: '2 op.',
  },
};

export const Critical: Story = {
  args: {
    code: 'EST-03',
    name: 'Parrilla Central',
    subtitle: 'Sellado a fuego alto',
    orderNumber: 'OP-000012',
    productName: 'Pollo asado porcionado',
    priority: 'urgente',
    quantityLabel: '50 kg',
    phaseLabel: 'Fase 3/4',
    progress: 120,
    efficiencyStatus: 'critical',
    timerLabel: '17:59',
    severity: 'critico',
    operators: [{ initials: 'AL', tone: 'warning' }],
    operatorCountLabel: '1 op.',
  },
};
