import type { Meta, StoryObj } from '@storybook/react';

import { WEB_LOGIN_HERO_IMAGE } from '../shared/web-login-assets';
import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginPageStoryMeta,
} from '../shared/story-decorators';
import { WebLoginImagePanel } from './WebLoginImagePanel';

const SAMPLE_IMAGE = WEB_LOGIN_HERO_IMAGE;

const meta: Meta<typeof WebLoginImagePanel> = {
  title: 'WebLogin/WebLoginImagePanel',
  component: WebLoginImagePanel,
  ...webLoginPageStoryMeta,
  args: {
    imageUrl: SAMPLE_IMAGE,
  },
};

export default meta;
type Story = StoryObj<typeof WebLoginImagePanel>;

export const Default: Story = {
  render: (args) => (
    <div style={{ height: 'min(80vh, 640px)', minWidth: 320 }}>
      <WebLoginImagePanel {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  render: (args) => (
    <div style={{ height: 'min(80vh, 640px)', minWidth: 320 }}>
      <WebLoginImagePanel {...args} theme="dark" />
    </div>
  ),
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  render: (args) => (
    <div style={{ height: 'min(80vh, 640px)', minWidth: 320 }}>
      <WebLoginImagePanel {...args} theme="light" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md', 'xl'] as const).map((size) => (
        <div key={size} style={{ height: 240, minWidth: 280 }}>
          <WebLoginImagePanel {...args} size={size} />
        </div>
      ))}
    </div>
  ),
};
