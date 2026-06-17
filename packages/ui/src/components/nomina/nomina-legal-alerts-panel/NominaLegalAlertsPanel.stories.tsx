import type { Meta, StoryObj } from '@storybook/react';

import { NominaLegalAlertsPanel } from './NominaLegalAlertsPanel';

const meta: Meta<typeof NominaLegalAlertsPanel> = {
  title: 'Nomina/NominaLegalAlertsPanel',
  component: NominaLegalAlertsPanel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaLegalAlertsPanel>;

const baseArgs = {
  emptyTitle: 'Sin alertas activas',
  emptyDescription: 'Todos los contratos y marcaciones cumplen con la normativa vigente.',
};

export const Dark: Story = {
  args: { ...baseArgs, theme: 'dark' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a', maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: { ...baseArgs, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef', maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
};
