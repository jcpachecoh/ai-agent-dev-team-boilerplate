import type { Meta, StoryObj } from '@storybook/react';
import { BarChart3, Calendar, FileText, Users } from 'lucide-react';

import { NominaReportList } from './NominaReportList';
import { NOMINA_DEMO_REPORTS } from '../shared/nomina-demo-data';

const meta: Meta<typeof NominaReportList> = {
  title: 'Nomina/NominaReportList',
  component: NominaReportList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaReportList>;

const reportIcons: Record<string, React.ReactNode> = {
  'nom-01': <Users />,
  'nom-02': <FileText />,
  'nom-03': <Calendar />,
  'nom-04': <BarChart3 />,
};

export const Dark: Story = {
  args: {
    theme: 'dark',
    items: NOMINA_DEMO_REPORTS,
    renderIcon: (item) => reportIcons[item.id],
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
