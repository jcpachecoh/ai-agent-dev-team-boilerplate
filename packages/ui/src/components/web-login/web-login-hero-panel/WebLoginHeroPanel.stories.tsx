import type { Meta, StoryObj } from '@storybook/react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginHeroPanel } from './WebLoginHeroPanel';

const meta: Meta<typeof WebLoginHeroPanel> = {
  title: 'WebLogin/WebLoginHeroPanel',
  component: WebLoginHeroPanel,
  ...webLoginStoryMeta,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof WebLoginHeroPanel>;

export const Default: Story = {
  args: {
    brandName: 'COMMAND CENTER',
    brandLocation: 'PLATFORM · RESTOPSIQ ENTERPRISE',
    brandInitial: 'R',
  },
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  args: { ...Default.args, theme: 'light' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <WebLoginHeroPanel {...args} size="sm" />
      <WebLoginHeroPanel {...args} size="md" />
      <WebLoginHeroPanel {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
