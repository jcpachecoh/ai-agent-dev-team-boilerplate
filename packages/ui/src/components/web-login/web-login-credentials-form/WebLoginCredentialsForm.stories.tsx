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
    'cedula' | 'pin' | 'onCedulaChange' | 'onPinChange' | 'onSubmit'
  >,
): React.JSX.Element {
  const [cedula, setCedula] = useState(props.error ? '1234567890' : '');
  const [pin, setPin] = useState('');

  return (
    <WebLoginCredentialsForm
      {...props}
      cedula={cedula}
      pin={pin}
      onCedulaChange={setCedula}
      onPinChange={setPin}
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
    <CredentialsFormStory {...args} error="Cédula o PIN incorrectos. Intenta de nuevo." />
  ),
};

export const Submitting: Story = {
  args: {
    cedula: '1234567890',
    pin: '1234',
    onCedulaChange: () => undefined,
    onPinChange: () => undefined,
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
