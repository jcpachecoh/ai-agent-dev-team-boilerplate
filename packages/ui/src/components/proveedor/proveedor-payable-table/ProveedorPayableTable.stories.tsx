import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { ProveedorMetricsBar } from '../proveedor-metrics-bar/ProveedorMetricsBar';
import { ProveedorPaymentConditionsPanel } from '../proveedor-payment-conditions-panel/ProveedorPaymentConditionsPanel';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorPayableTable } from './ProveedorPayableTable';

const sampleRows = [
  {
    invoiceId: 'FV-2024-0428',
    orderId: 'OC-2024-0156',
    date: '2024-05-28',
    dueDate: '2024-06-27',
    amount: '$8.750.000',
    aging: '4d',
    status: 'pending' as const,
  },
  {
    invoiceId: 'FV-2024-0390',
    orderId: 'OC-2024-0142',
    date: '2024-05-10',
    dueDate: '2024-06-09',
    amount: '$12.350.000',
    aging: '12d',
    status: 'pending' as const,
  },
  {
    invoiceId: 'FV-2024-0312',
    orderId: 'OC-2024-0110',
    date: '2024-04-01',
    dueDate: '2024-05-01',
    amount: '$6.100.000',
    aging: '31d',
    status: 'overdue' as const,
  },
  {
    invoiceId: 'FV-2024-0280',
    orderId: 'OC-2024-0098',
    date: '2024-03-15',
    dueDate: '2024-04-14',
    amount: '$4.500.000',
    aging: '—',
    status: 'paid' as const,
  },
];

const payableMetrics = [
  { label: 'Total Pendiente', value: '$21.1M', valueColor: 'warning' as const },
  { label: 'Vencido', value: '$11.2M', valueColor: 'danger' as const },
  { label: 'Facturas Pendientes', value: '2', valueColor: 'purple' as const },
  { label: 'Días Promedio Pago', value: '28', valueColor: 'info' as const },
];

const meta: Meta<typeof ProveedorPayableTable> = {
  title: 'Proveedor/ProveedorPayableTable',
  component: ProveedorPayableTable,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl', rows: sampleRows, theme: 'dark' },
};
export default meta;
type Story = StoryObj<typeof ProveedorPayableTable>;

export const Default: Story = {};

export const WithPanels: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <ProveedorMetricsBar metrics={payableMetrics} theme={args.theme} size="xl" />
      <ProveedorPaymentConditionsPanel theme={args.theme} size="xl" />
      <ProveedorPayableTable {...args} />
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
