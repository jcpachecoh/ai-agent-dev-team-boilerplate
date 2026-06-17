import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { TripProgressStrip } from './TripProgressStrip';

const meta: Meta<typeof TripProgressStrip> = {
  title: 'Field Ops/TripProgressStrip',
  component: TripProgressStrip,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof TripProgressStrip>;

export const Default: Story = {
  args: {
    label: 'Cantidad a producir',
    value: '50 kg',
  },
};

export const InProgress: Story = {
  args: {
    label: 'Cantidad a producir',
    value: '32 kg',
  },
};

export const Completed: Story = {
  args: {
    label: 'Cantidad a producir',
    value: '50 kg',
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    label: 'Cantidad a producir',
    value: '50 kg',
    theme: 'dark',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}
    >
      <TripProgressStrip {...args} size="sm" />
      <TripProgressStrip {...args} size="md" />
      <TripProgressStrip {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

export const Loading: Story = {
  args: {
    label: 'Cantidad a producir',
    value: '—',
    loading: true,
  },
};
