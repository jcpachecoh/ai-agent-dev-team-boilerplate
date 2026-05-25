import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { TripActionButton } from './TripActionButton';

const meta: Meta<typeof TripActionButton> = {
  title: 'Field Ops/TripActionButton',
  component: TripActionButton,
  ...fieldOpsStoryMeta,
  argTypes: {
    ...fieldOpsStoryMeta.argTypes,
    variant: {
      control: 'radio',
      options: ['pause', 'report-issue'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TripActionButton>;

export const Pause: Story = {
  args: { variant: 'pause' },
};

export const ReportIssue: Story = {
  args: { variant: 'report-issue' },
};

export const Disabled: Story = {
  args: { variant: 'pause', disabled: true },
};

export const Loading: Story = {
  args: { variant: 'report-issue', loading: true },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { variant: 'pause', theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
      <TripActionButton {...args} size="sm" variant="pause" />
      <TripActionButton {...args} size="md" variant="report-issue" />
      <TripActionButton {...args} size="xl" variant="pause" />
    </div>
  ),
};
