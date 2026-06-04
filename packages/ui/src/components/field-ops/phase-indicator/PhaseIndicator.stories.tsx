import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PhaseIndicator } from './PhaseIndicator';

const demoOperators = [
  { id: '1', name: 'Carlos Mendoza', initials: 'CM', accent: 'blue' as const, timer: '47:22' },
  { id: '2', name: 'Pedro Torres', initials: 'PT', accent: 'gold' as const, timer: '33:05' },
  { id: '3', name: 'Jorge García', initials: 'JG', accent: 'purple' as const, timer: '18:54' },
];

const meta: Meta<typeof PhaseIndicator> = {
  title: 'Field Ops/PhaseIndicator',
  component: PhaseIndicator,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PhaseIndicator>;

export const Default: Story = {
  args: {
    operators: demoOperators,
  },
};

export const Current: Story = {
  args: {
    operators: [demoOperators[0]],
    title: 'Operador activo',
  },
};

export const Done: Story = {
  args: {
    operators: demoOperators.map((op) => ({ ...op, active: false, timer: undefined })),
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    operators: demoOperators,
    theme: 'dark',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}
    >
      <PhaseIndicator {...args} size="sm" />
      <PhaseIndicator {...args} size="md" />
      <PhaseIndicator {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

export const Loading: Story = {
  args: {
    operators: [],
    loading: true,
  },
};
