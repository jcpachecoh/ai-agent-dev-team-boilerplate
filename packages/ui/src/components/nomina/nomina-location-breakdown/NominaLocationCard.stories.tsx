import type { Meta, StoryObj } from '@storybook/react';

import { NominaLocationCard } from './NominaLocationCard';
import { NOMINA_DEMO_LOCATION_ROWS } from '../shared/nomina-demo-data';

const meta: Meta<typeof NominaLocationCard> = {
  title: 'Nomina/NominaLocationCard',
  component: NominaLocationCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaLocationCard>;

export const Dark: Story = {
  args: {
    theme: 'dark',
    row: NOMINA_DEMO_LOCATION_ROWS[0],
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a', maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  ...Dark,
  args: { ...Dark.args, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef', maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
};
