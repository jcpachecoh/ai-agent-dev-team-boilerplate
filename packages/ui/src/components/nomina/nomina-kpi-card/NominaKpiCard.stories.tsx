import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Clock3, DollarSign, Users } from 'lucide-react';

import { NominaKpiCard } from './NominaKpiCard';

const meta: Meta<typeof NominaKpiCard> = {
  title: 'Nomina/NominaKpiCard',
  component: NominaKpiCard,
  tags: ['autodocs'],
  args: {
    theme: 'dark',
  },
};

export default meta;
type Story = StoryObj<typeof NominaKpiCard>;

export const AccentDark: Story = {
  args: {
    title: 'Nómina estimada mes',
    value: '$ 34.660.000',
    description: '16 empleados activos',
    tone: 'accent',
    icon: <DollarSign />,
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a', maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const AccentLight: Story = {
  ...AccentDark,
  args: { ...AccentDark.args, theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f6f4ef', maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const AllTonesDark: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
        padding: 24,
        background: '#0a0a0a',
      }}
    >
      <NominaKpiCard
        theme="dark"
        tone="accent"
        title="Nómina estimada mes"
        value="$ 34.660.000"
        description="16 empleados activos"
        icon={<DollarSign />}
      />
      <NominaKpiCard
        theme="dark"
        tone="amber"
        title="Total horas extras"
        value="1h 45m"
        description="Acumulado del día"
        icon={<Clock3 />}
      />
      <NominaKpiCard
        theme="dark"
        tone="teal"
        title="Empleados activos"
        value="16"
        description="de 18 totales"
        icon={<Users />}
      />
      <NominaKpiCard
        theme="dark"
        tone="muted"
        title="Alertas legales"
        value="0"
        description="Sin alertas activas"
        icon={<AlertTriangle />}
      />
    </div>
  ),
};
