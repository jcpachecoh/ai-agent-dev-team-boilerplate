import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginFormPanel } from './WebLoginFormPanel';

const DEMO = { email: 'mes-owner@palos-de-lena.dev', password: 'TestPass123!' };

function FormPanelStory(
  props: Omit<
    React.ComponentProps<typeof WebLoginFormPanel>,
    'email' | 'password' | 'onEmailChange' | 'onPasswordChange' | 'onSubmit'
  >,
): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <WebLoginFormPanel
      {...props}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={() => undefined}
      demoCredentials={DEMO}
      onUseDemo={() => {
        setEmail(DEMO.email);
        setPassword(DEMO.password);
      }}
    />
  );
}

const meta: Meta<typeof WebLoginFormPanel> = {
  title: 'WebLogin/WebLoginFormPanel',
  component: WebLoginFormPanel,
  ...webLoginStoryMeta,
};

export default meta;
type Story = StoryObj<typeof WebLoginFormPanel>;

export const Default: Story = {
  render: (args) => <FormPanelStory {...args} />,
};

export const WithError: Story = {
  render: (args) => (
    <FormPanelStory {...args} error="Correo o contraseña incorrectos. Intenta de nuevo." />
  ),
};

export const Submitting: Story = {
  args: {
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
  render: (args) => <FormPanelStory {...args} demoCredentials={undefined} onUseDemo={undefined} />,
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  render: (args) => <FormPanelStory {...args} theme="dark" />,
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  render: (args) => <FormPanelStory {...args} theme="light" />,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, alignItems: 'flex-start' }}>
      <FormPanelStory {...args} size="sm" />
      <FormPanelStory {...args} size="md" />
      <FormPanelStory {...args} size="xl" />
    </div>
  ),
};
