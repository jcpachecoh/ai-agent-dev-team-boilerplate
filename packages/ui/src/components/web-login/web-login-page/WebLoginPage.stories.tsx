import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { WEB_LOGIN_HERO_IMAGE } from '../shared/web-login-assets';
import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginPageStoryMeta,
} from '../shared/story-decorators';
import { WebLoginPage } from './WebLoginPage';

const HERO_IMAGE = WEB_LOGIN_HERO_IMAGE;

const DEMO = { email: 'mes-owner@palos-de-lena.dev', password: 'TestPass123!' };

function WebLoginPageStory(
  props: Omit<
    React.ComponentProps<typeof WebLoginPage>,
    'email' | 'password' | 'onEmailChange' | 'onPasswordChange' | 'onSubmit' | 'heroImageUrl'
  > & { initialError?: string | null },
): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(props.initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <WebLoginPage
      {...props}
      heroImageUrl={HERO_IMAGE}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      error={error}
      isSubmitting={isSubmitting}
      demoCredentials={props.demoCredentials ?? DEMO}
      onUseDemo={() => {
        setEmail(DEMO.email);
        setPassword(DEMO.password);
        setError(null);
      }}
      onSubmit={() => {
        setIsSubmitting(true);
        setError(null);
        window.setTimeout(() => {
          setIsSubmitting(false);
          if (email !== DEMO.email || password !== DEMO.password) {
            setError('Correo o contraseña incorrectos. Intenta de nuevo.');
          }
        }, 800);
      }}
    />
  );
}

const meta: Meta<typeof WebLoginPage> = {
  title: 'WebLogin/WebLoginPage',
  component: WebLoginPage,
  ...webLoginPageStoryMeta,
  parameters: {
    ...webLoginPageStoryMeta.parameters,
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof WebLoginPage>;

export const Default: Story = {
  render: (args) => <WebLoginPageStory {...args} />,
};

export const WithError: Story = {
  render: (args) => <WebLoginPageStory {...args} initialError="Correo o contraseña incorrectos." />,
};

export const Submitting: Story = {
  args: {
    heroImageUrl: HERO_IMAGE,
    email: 'mes-owner@palos-de-lena.dev',
    password: 'TestPass123!',
    onEmailChange: () => undefined,
    onPasswordChange: () => undefined,
    onSubmit: () => undefined,
    isSubmitting: true,
    demoCredentials: DEMO,
  },
};

export const WithoutDemo: Story = {
  render: (args) => (
    <WebLoginPageStory {...args} demoCredentials={undefined} onUseDemo={undefined} />
  ),
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  render: (args) => <WebLoginPageStory {...args} theme="dark" />,
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  render: (args) => <WebLoginPageStory {...args} theme="light" />,
};

export const MobileViewport: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: (args) => <WebLoginPageStory {...args} />,
};

export const SizeSmall: Story = {
  render: (args) => <WebLoginPageStory {...args} size="sm" />,
};

export const SizeMedium: Story = {
  render: (args) => <WebLoginPageStory {...args} size="md" />,
};

export const SizeLarge: Story = {
  render: (args) => <WebLoginPageStory {...args} size="xl" />,
};

/** Alias: compare sm / md / xl (scroll vertically in fullscreen). */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <WebLoginPageStory {...args} size="sm" />
      <WebLoginPageStory {...args} size="md" />
      <WebLoginPageStory {...args} size="xl" />
    </div>
  ),
};
