import type { Meta, StoryObj } from '@storybook/react';

import { NominaLocationBreakdown } from './NominaLocationBreakdown';
import { NOMINA_DEMO_LOCATION_ROWS } from '../shared/nomina-demo-data';

const meta: Meta<typeof NominaLocationBreakdown> = {
  title: 'Nomina/NominaLocationBreakdown',
  component: NominaLocationBreakdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof NominaLocationBreakdown>;

export const DarkDesktop: Story = {
  args: {
    theme: 'dark',
    title: 'Por sede',
    rows: NOMINA_DEMO_LOCATION_ROWS,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a', maxWidth: 900 }}>
        <Story />
      </div>
    ),
  ],
};

export const LightDesktop: Story = {
  ...DarkDesktop,
  args: { ...DarkDesktop.args, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef', maxWidth: 900 }}>
        <Story />
      </div>
    ),
  ],
};

export const DarkMobile: Story = {
  ...DarkDesktop,
  decorators: [
    (Story) => (
      <div style={{ padding: 16, background: '#0a0a0a', maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
};

export const LightMobile: Story = {
  ...DarkMobile,
  args: { ...DarkDesktop.args, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 16, background: '#f6f4ef', maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
};
