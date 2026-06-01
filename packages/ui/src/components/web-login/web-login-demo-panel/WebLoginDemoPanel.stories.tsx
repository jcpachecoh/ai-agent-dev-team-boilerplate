import type { Meta, StoryObj } from '@storybook/react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginDemoPanel } from './WebLoginDemoPanel';

const DEMO = { cedula: '1234567890', pin: '1234' };

const meta: Meta<typeof WebLoginDemoPanel> = {
  title: 'WebLogin/WebLoginDemoPanel',
  component: WebLoginDemoPanel,
  ...webLoginStoryMeta,
  args: {
    credentials: DEMO,
    onUseDemo: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof WebLoginDemoPanel>;

export const Default: Story = {};

export const WithoutButton: Story = {
  args: { onUseDemo: undefined },
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  args: { theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <WebLoginDemoPanel {...args} size="sm" />
      <WebLoginDemoPanel {...args} size="md" />
      <WebLoginDemoPanel {...args} size="xl" />
    </div>
  ),
};
