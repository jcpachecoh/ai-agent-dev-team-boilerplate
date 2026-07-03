import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorMetricsPanel } from './ProveedorMetricsPanel';

const meta: Meta<typeof ProveedorMetricsPanel> = {
  title: 'Proveedor/ProveedorMetricsPanel',
  component: ProveedorMetricsPanel,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProveedorMetricsPanel>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 584 }}>
      <ProveedorMetricsPanel {...args} size="sm" />
      <ProveedorMetricsPanel {...args} size="md" />
      <ProveedorMetricsPanel {...args} size="xl" />
    </div>
  ),
};
