import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioDistributionBar } from './InventarioDistributionBar';

const meta: Meta<typeof InventarioDistributionBar> = {
  title: 'Inventario/InventarioDistributionBar',
  component: InventarioDistributionBar,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.distributionBar, '2075:2200'),
};

export default meta;
type Story = StoryObj<typeof InventarioDistributionBar>;

export const Default: Story = { args: { label: 'Proteínas', value: '32%', progress: 32 } };

export const ReportList: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <InventarioDistributionBar
        {...args}
        label="Proteínas"
        value="32%"
        progress={32}
        accent="success"
      />
      <InventarioDistributionBar {...args} label="Granos" value="24%" progress={24} accent="info" />
      <InventarioDistributionBar
        {...args}
        label="Verduras"
        value="18%"
        progress={18}
        accent="warning"
      />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <InventarioDistributionBar {...args} size="sm" />
      <InventarioDistributionBar {...args} size="md" />
      <InventarioDistributionBar {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
