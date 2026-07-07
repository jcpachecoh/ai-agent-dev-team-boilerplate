import type { Meta, StoryObj } from '@storybook/react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginStatCard } from './WebLoginStatCard';

const meta: Meta<typeof WebLoginStatCard> = {
  title: 'WebLogin/WebLoginStatCard',
  component: WebLoginStatCard,
  ...webLoginStoryMeta,
};

export default meta;
type Story = StoryObj<typeof WebLoginStatCard>;

export const SalesToday: Story = {
  args: {
    label: 'Ventas hoy',
    value: '$4.280.000',
    trendLabel: '↑ 12% vs ayer',
    trendTone: 'success',
  },
};

export const ActiveOrders: Story = {
  args: {
    label: 'Órdenes activas',
    value: '23',
    trendLabel: '8 en cocina',
    trendTone: 'neutral',
  },
};

export const Alerts: Story = {
  args: {
    label: 'Alertas',
    value: '3',
    trendLabel: '2 inventario',
    trendTone: 'warning',
  },
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  args: { ...SalesToday.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  args: { ...SalesToday.args, theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <WebLoginStatCard {...args} size="sm" />
      <WebLoginStatCard {...args} size="md" />
      <WebLoginStatCard {...args} size="xl" />
    </div>
  ),
  args: SalesToday.args,
};
