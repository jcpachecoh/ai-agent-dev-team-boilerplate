import type { Meta, StoryObj } from '@storybook/react';
import { Users } from 'lucide-react';

import { NominaReportItem } from './NominaReportItem';

const meta: Meta<typeof NominaReportItem> = {
  title: 'Nomina/NominaReportItem',
  component: NominaReportItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaReportItem>;

export const Dark: Story = {
  args: {
    theme: 'dark',
    code: 'NOM-01',
    title: 'Empleados',
    description: 'Listado completo con datos contractuales',
    tone: 'accent',
    icon: <Users />,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0a0a0a', maxWidth: 400 }}>
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
      <div style={{ padding: 24, background: '#f6f4ef', maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};
