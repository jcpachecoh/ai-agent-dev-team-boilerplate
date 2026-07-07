import type { Meta, StoryObj } from '@storybook/react';

import { NominaLegendItem } from './NominaLegendItem';
import { getNominaLocationColor } from '../shared/nomina-utils';

const meta: Meta<typeof NominaLegendItem> = {
  title: 'Nomina/NominaLegendItem',
  component: NominaLegendItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaLegendItem>;

export const Dark: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 24, background: '#0a0a0a' }}>
      <NominaLegendItem theme="dark" label="Chapinero" color={getNominaLocationColor('accent')} />
      <NominaLegendItem theme="dark" label="Zona Rosa" color={getNominaLocationColor('purple')} />
      <NominaLegendItem theme="dark" label="El Poblado" color={getNominaLocationColor('teal')} />
      <NominaLegendItem theme="dark" label="Unicentro" color={getNominaLocationColor('amber')} />
    </div>
  ),
};

export const Light: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 24, background: '#f6f4ef' }}>
      <NominaLegendItem theme="light" label="Chapinero" color={getNominaLocationColor('accent')} />
      <NominaLegendItem theme="light" label="Zona Rosa" color={getNominaLocationColor('purple')} />
      <NominaLegendItem theme="light" label="El Poblado" color={getNominaLocationColor('teal')} />
      <NominaLegendItem theme="light" label="Unicentro" color={getNominaLocationColor('amber')} />
    </div>
  ),
};
