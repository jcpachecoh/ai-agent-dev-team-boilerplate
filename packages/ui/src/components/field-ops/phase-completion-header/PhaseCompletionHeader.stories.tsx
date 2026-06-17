import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PhaseCompletionHeader } from './PhaseCompletionHeader';

const meta: Meta<typeof PhaseCompletionHeader> = {
  title: 'Field Ops/PhaseCompletionHeader',
  component: PhaseCompletionHeader,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PhaseCompletionHeader>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <PhaseCompletionHeader {...args} size="sm" />
      <PhaseCompletionHeader {...args} size="md" />
      <PhaseCompletionHeader {...args} size="xl" />
    </div>
  ),
};
