import type { Meta, StoryObj } from '@storybook/react';

import { NominaClosingBadge } from './NominaClosingBadge';
import { NominaPageHeader } from './NominaPageHeader';

const meta: Meta<typeof NominaPageHeader> = {
  title: 'Nomina/NominaPageHeader',
  component: NominaPageHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaPageHeader>;

export const Dark: Story = {
  args: {
    theme: 'dark',
    title: 'Reportes de nómina',
    subtitle: 'Métricas consolidadas por sede y periodo',
    badge: <NominaClosingBadge theme="dark" label="Cierre: 30 jun" />,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  ...Dark,
  args: {
    ...Dark.args,
    theme: 'light',
    badge: <NominaClosingBadge theme="light" label="Cierre: 30 jun" />,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef' }}>
        <Story />
      </div>
    ),
  ],
};
