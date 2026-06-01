import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginStoryMeta,
} from '../shared/story-decorators';
import { WebLoginFormPanel } from './WebLoginFormPanel';

const DEMO = { cedula: '1234567890', pin: '1234' };

function FormPanelStory(
  props: Omit<
    React.ComponentProps<typeof WebLoginFormPanel>,
    'cedula' | 'pin' | 'onCedulaChange' | 'onPinChange' | 'onSubmit'
  >,
): React.JSX.Element {
  const [cedula, setCedula] = useState('');
  const [pin, setPin] = useState('');

  return (
    <WebLoginFormPanel
      {...props}
      cedula={cedula}
      pin={pin}
      onCedulaChange={setCedula}
      onPinChange={setPin}
      onSubmit={() => undefined}
      demoCredentials={DEMO}
      onUseDemo={() => {
        setCedula(DEMO.cedula);
        setPin(DEMO.pin);
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
    <FormPanelStory {...args} error="Cédula o PIN incorrectos. Intenta de nuevo." />
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
