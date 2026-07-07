import type { Meta, StoryObj } from '@storybook/react';

import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionKpiCell } from './ProduccionKpiCell';

const meta: Meta<typeof ProduccionKpiCell> = {
  title: 'Produccion/ProduccionKpiCell',
  component: ProduccionKpiCell,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.kpiCell, '2096:171'),
};
export default meta;
type Story = StoryObj<typeof ProduccionKpiCell>;
export const Default: Story = {
  args: {
    theme: 'light',
  },
};
export const Oee: Story = {
  args: { label: 'OEE Línea', value: '84.2', unit: '%', delta: '▲ +1.1% turno', accent: 'teal' },
};
export const Alarms: Story = {
  args: {
    label: 'Alarmas activas',
    value: '4',
    unit: undefined,
    delta: undefined,
    accent: 'danger',
  },
};
