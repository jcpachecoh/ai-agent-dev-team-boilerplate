import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { FieldStatusCard } from './FieldStatusCard';

const meta: Meta<typeof FieldStatusCard> = {
  title: 'Field Ops/FieldStatusCard',
  component: FieldStatusCard,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof FieldStatusCard>;

/** Reference: KDS active phase — elapsed time card (dark + gold). */
const referenceTimerArgs = {
  title: 'Tiempo transcurrido',
  value: '12:45',
  subtitle: 'Tiempo estándar: 15:00',
  statusTag: 'Alerta',
  progress: 85,
  progressLabel: '85%',
  accent: 'gold' as const,
  theme: 'dark' as const,
  size: 'md' as const,
};

export const Default: Story = {
  args: referenceTimerArgs,
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: referenceTimerArgs,
};

export const ReferenceTimer: Story = {
  name: 'Reference / Timer 85%',
  decorators: [darkModeDecorator],
  args: referenceTimerArgs,
  parameters: {
    layout: 'centered',
  },
};

export const Sizes: Story = {
  decorators: [darkModeDecorator],
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 420 }}
    >
      <FieldStatusCard {...args} size="sm" />
      <FieldStatusCard {...args} size="md" />
      <FieldStatusCard {...args} size="xl" />
    </div>
  ),
  args: referenceTimerArgs,
};

export const Loading: Story = {
  decorators: [darkModeDecorator],
  args: {
    title: 'Tiempo transcurrido',
    value: '—',
    theme: 'dark',
    loading: true,
  },
};

export const OverStandard: Story = {
  name: 'Over standard (red)',
  decorators: [darkModeDecorator],
  args: {
    ...referenceTimerArgs,
    value: '16:02',
    progress: 100,
    progressLabel: '100%',
    accent: 'warning',
  },
};
