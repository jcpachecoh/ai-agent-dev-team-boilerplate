import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { ProveedorFilterButtonGroup } from '../proveedor-filter-button-group/ProveedorFilterButtonGroup';
import { ProveedorMetricsBar } from '../proveedor-metrics-bar/ProveedorMetricsBar';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorOcHistoryTable } from './ProveedorOcHistoryTable';

const sampleRows = [
  {
    orderId: 'OC-2024-0156',
    date: '2024-05-28',
    items: 12,
    total: '$8.750.000',
    deliveryDate: '2024-05-28',
    status: 'delivered' as const,
  },
  {
    orderId: 'OC-2024-0155',
    date: '2024-05-20',
    items: 8,
    total: '$5.200.000',
    deliveryDate: '2024-05-22',
    status: 'pending' as const,
  },
  {
    orderId: 'OC-2024-0140',
    date: '2024-04-10',
    items: 5,
    total: '$2.100.000',
    deliveryDate: '—',
    status: 'cancelled' as const,
  },
];

const ocMetrics = [
  { label: 'Total OCs', value: '156', valueColor: 'enterprise' as const },
  { label: 'Monto Total', value: '$2.450M', valueColor: 'success' as const },
  { label: 'Promedio Mensual', value: '$245M', valueColor: 'purple' as const },
  { label: 'Tasa Entrega', value: '98.2%', valueColor: 'info' as const },
];

const meta: Meta<typeof ProveedorOcHistoryTable> = {
  title: 'Proveedor/ProveedorOcHistoryTable',
  component: ProveedorOcHistoryTable,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl', rows: sampleRows, theme: 'dark' },
};
export default meta;
type Story = StoryObj<typeof ProveedorOcHistoryTable>;

export const Default: Story = {};

export const WithToolbar: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <ProveedorMetricsBar metrics={ocMetrics} theme={args.theme} size="xl" />
      <ProveedorFilterButtonGroup
        options={[
          { id: 'all', label: 'TODAS' },
          { id: 'delivered', label: 'ENTREGADAS' },
          { id: 'pending', label: 'PENDIENTES' },
          { id: 'cancelled', label: 'CANCELADAS' },
        ]}
        activeId="all"
        theme={args.theme}
        size="md"
      />
      <ProveedorOcHistoryTable {...args} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: '100%', maxWidth: 1200 }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = { args: { rows: [] } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
