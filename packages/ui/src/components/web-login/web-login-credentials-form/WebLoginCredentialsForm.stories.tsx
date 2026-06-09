import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginCredentialsForm } from './WebLoginCredentialsForm';

function CredentialsFormStory(
  props: Omit<
    React.ComponentProps<typeof WebLoginCredentialsForm>,
    'email' | 'password' | 'onEmailChange' | 'onPasswordChange' | 'onSubmit'
  >,
): React.JSX.Element {
  const [email, setEmail] = useState(props.error ? 'demo@palos-de-lena.dev' : '');
  const [password, setPassword] = useState('');

  return (
    <WebLoginCredentialsForm
      {...props}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={() => undefined}
    />
  );
}

const meta: Meta<typeof WebLoginCredentialsForm> = {
  title: 'WebLogin/WebLoginCredentialsForm',
  component: WebLoginCredentialsForm,
  ...webLoginStoryMeta,
};

export default meta;
type Story = StoryObj<typeof WebLoginCredentialsForm>;

export const Default: Story = {
  render: (args) => <CredentialsFormStory {...args} />,
};

export const WithError: Story = {
  render: (args) => (
    <CredentialsFormStory {...args} error="Correo o contraseña incorrectos. Intenta de nuevo." />
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
  },
};

export const DarkMode: Story = {
  decorators: [webLoginDarkDecorator],
  render: (args) => <CredentialsFormStory {...args} theme="dark" />,
};

export const LightMode: Story = {
  decorators: [webLoginLightDecorator],
  render: (args) => <CredentialsFormStory {...args} theme="light" />,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
      <CredentialsFormStory {...args} size="sm" />
      <CredentialsFormStory {...args} size="md" />
      <CredentialsFormStory {...args} size="xl" />
    </div>
  ),
};
