import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorMetricsBar } from './ProveedorMetricsBar';

const meta: Meta<typeof ProveedorMetricsBar> = {
  title: 'Proveedor/ProveedorMetricsBar',
  component: ProveedorMetricsBar,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: {
    theme: 'dark',
    size: 'xl',
    metrics: [
      { label: 'Total OCs', value: '156', valueColor: 'enterprise' },
      { label: 'Monto Total', value: '$2.450M', valueColor: 'success' },
      { label: 'Promedio Mensual', value: '$245M', valueColor: 'purple' },
      { label: 'Tasa Entrega', value: '98.2%', valueColor: 'info' },
    ],
  },
};
export default meta;
type Story = StoryObj<typeof ProveedorMetricsBar>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
