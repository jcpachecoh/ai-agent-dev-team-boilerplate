import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PhaseBackButton } from './PhaseBackButton';

const meta: Meta<typeof PhaseBackButton> = {
  title: 'Field Ops/PhaseBackButton',
  component: PhaseBackButton,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PhaseBackButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
      <PhaseBackButton {...args} size="sm" />
      <PhaseBackButton {...args} size="md" />
      <PhaseBackButton {...args} size="xl" />
    </div>
  ),
};
