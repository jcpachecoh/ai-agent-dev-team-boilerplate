import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { ProveedorCertificationsPanel } from '../proveedor-certifications-panel/ProveedorCertificationsPanel';
import { ProveedorMetricsBar } from '../proveedor-metrics-bar/ProveedorMetricsBar';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorQualityTable } from './ProveedorQualityTable';

const sampleRows = [
  {
    date: '2024-05-28',
    type: 'Inspección Recepción',
    score: 98,
    scoreTone: 'high' as const,
    defects: 0,
    inspector: 'J. Martínez',
    compliance: 'conform' as const,
  },
  {
    date: '2024-05-15',
    type: 'Auditoría Calidad',
    score: 88,
    scoreTone: 'medium' as const,
    defects: 2,
    inspector: 'L. Gómez',
    compliance: 'non-conform' as const,
  },
  {
    date: '2024-04-30',
    type: 'Inspección Recepción',
    score: 95,
    scoreTone: 'high' as const,
    defects: 1,
    inspector: 'J. Martínez',
    compliance: 'conform' as const,
  },
];

const qualityMetrics = [
  { label: 'Calificación Promedio', value: '94.0', valueColor: 'info' as const },
  { label: 'Tasa Cumplimiento', value: '96%', valueColor: 'info' as const },
  { label: 'Defectos Totales', value: '6', valueColor: 'enterprise' as const },
  { label: 'Auditorías', value: '18', valueColor: 'purple' as const },
];

const meta: Meta<typeof ProveedorQualityTable> = {
  title: 'Proveedor/ProveedorQualityTable',
  component: ProveedorQualityTable,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl', rows: sampleRows, theme: 'dark' },
};
export default meta;
type Story = StoryObj<typeof ProveedorQualityTable>;

export const Default: Story = {};

export const WithPanels: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <ProveedorMetricsBar metrics={qualityMetrics} theme={args.theme} size="xl" />
      <ProveedorCertificationsPanel theme={args.theme} size="xl" />
      <ProveedorQualityTable {...args} />
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
