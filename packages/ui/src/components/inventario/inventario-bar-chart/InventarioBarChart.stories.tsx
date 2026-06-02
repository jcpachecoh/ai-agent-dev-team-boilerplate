import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import { inventarioLightDecorator, inventarioStoryMeta } from '../shared/story-decorators';
import { InventarioBarChart } from './InventarioBarChart';

const meta: Meta<typeof InventarioBarChart> = {
  title: 'Inventario/InventarioBarChart',
  component: InventarioBarChart,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.barChart, '2075:834'),
  argTypes: {
    accent: {
      control: 'select',
      options: ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioBarChart>;

export const Default: Story = {};

export const CustomSeries: Story = {
  args: {
    items: [
      { label: 'Sem 1', value: 72 },
      { label: 'Sem 2', value: 81 },
      { label: 'Sem 3', value: 65 },
      { label: 'Sem 4', value: 88 },
    ],
  },
};

export const DarkMode: Story = {
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InventarioBarChart {...args} size="sm" />
      <InventarioBarChart {...args} size="md" />
      <InventarioBarChart {...args} size="xl" />
    </div>
  ),
};
