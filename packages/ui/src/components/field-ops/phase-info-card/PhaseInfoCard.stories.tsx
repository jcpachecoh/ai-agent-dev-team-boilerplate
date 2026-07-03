import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PhaseInfoCard } from './PhaseInfoCard';

const meta: Meta<typeof PhaseInfoCard> = {
  title: 'Field Ops/PhaseInfoCard',
  component: PhaseInfoCard,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PhaseInfoCard>;

export const Default: Story = {
  args: {
    opId: 'OP - 000012',
    phaseLabel: 'Fase 2 — Corte y porcionado',
    productName: 'Pollo asado porcionado',
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}
    >
      <PhaseInfoCard {...args} size="sm" />
      <PhaseInfoCard {...args} size="md" />
      <PhaseInfoCard {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

export const Loading: Story = {
  args: { ...Default.args, loading: true },
};
