import type { Meta, StoryObj } from '@storybook/react';

import {
  darkModeDecorator,
  fieldOpsStoryMeta,
  paddedContainerDecorator,
} from '../shared/story-decorators';
import { CompletePhaseButton } from './CompletePhaseButton';

const meta: Meta<typeof CompletePhaseButton> = {
  title: 'Field Ops/CompletePhaseButton',
  component: CompletePhaseButton,
  ...fieldOpsStoryMeta,
  argTypes: {
    ...fieldOpsStoryMeta.argTypes,
    variant: {
      control: 'radio',
      options: ['default', 'confirm'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompletePhaseButton>;

export const Default: Story = {
  args: { variant: 'default' },
};

export const Confirm: Story = {
  args: {
    variant: 'confirm',
    label: 'Confirmar y completar fase',
    size: 'xl',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const FullWidthXL: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: 480 }}>
        <Story />
      </div>
    ),
  ],
  args: { variant: 'confirm', size: 'xl' },
};

export const Disabled: Story = {
  args: { variant: 'confirm', disabled: true, size: 'xl' },
};

export const Loading: Story = {
  args: { variant: 'confirm', loading: true, size: 'xl' },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { variant: 'confirm', theme: 'dark', size: 'xl' },
};

export const Sizes: Story = {
  decorators: [paddedContainerDecorator],
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <CompletePhaseButton {...args} variant="default" size="sm" />
      <CompletePhaseButton {...args} variant="default" size="md" />
      <CompletePhaseButton {...args} variant="confirm" size="md" />
      <CompletePhaseButton {...args} variant="confirm" size="xl" />
    </div>
  ),
};
