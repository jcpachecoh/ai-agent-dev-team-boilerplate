import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { NominaChartPanel } from './NominaChartPanel';
import {
  NOMINA_DEMO_CHART_DATA,
  NOMINA_DEMO_CHART_LEGEND,
  NOMINA_DEMO_CHART_SERIES,
} from '../shared/nomina-demo-data';

const meta: Meta<typeof NominaChartPanel> = {
  title: 'Nomina/NominaChartPanel',
  component: NominaChartPanel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaChartPanel>;

function ChartDemo({ theme }: { theme: 'light' | 'dark' }) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  return (
    <div style={{ padding: 24, background: theme === 'dark' ? '#0a0a0a' : '#f6f4ef' }}>
      <NominaChartPanel
        theme={theme}
        title="Nómina estimada por sede"
        period={period}
        onPeriodChange={setPeriod}
        data={NOMINA_DEMO_CHART_DATA}
        xDataKey="week"
        series={NOMINA_DEMO_CHART_SERIES}
        legend={NOMINA_DEMO_CHART_LEGEND}
      />
    </div>
  );
}

export const Dark: Story = {
  render: () => <ChartDemo theme="dark" />,
};

export const Light: Story = {
  render: () => <ChartDemo theme="light" />,
};
