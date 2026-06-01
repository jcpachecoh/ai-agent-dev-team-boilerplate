import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  webLoginDarkDecorator,
  webLoginLightDecorator,
  webLoginPageStoryMeta,
} from '../shared/story-decorators';
import { WebLoginPage } from './WebLoginPage';

const DEMO = { cedula: '12345678', pin: '1234' };

function WebLoginPageStory(
  props: Omit<
    React.ComponentProps<typeof WebLoginPage>,
    'cedula' | 'pin' | 'onCedulaChange' | 'onPinChange' | 'onSubmit'
  > & { initialError?: string | null },
): React.JSX.Element {
  const [cedula, setCedula] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(props.initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <WebLoginPage
      {...props}
      brandName="COMMAND CENTER"
      brandLocation="PLATFORM · RESTOPSIQ ENTERPRISE"
      brandInitial="R"
      cedula={cedula}
      pin={pin}
      onCedulaChange={setCedula}
      onPinChange={setPin}
      error={error}
      isSubmitting={isSubmitting}
      demoCredentials={props.demoCredentials ?? DEMO}
      onUseDemo={() => {
        setCedula(DEMO.cedula);
        setPin(DEMO.pin);
        setError(null);
      }}
      onSubmit={() => {
        setIsSubmitting(true);
        setError(null);
        window.setTimeout(() => {
          setIsSubmitting(false);
          if (cedula !== DEMO.cedula || pin !== DEMO.pin) {
            setError('Cédula o PIN incorrectos. Intenta de nuevo.');
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
  render: (args) => <WebLoginPageStory {...args} initialError="Cédula o PIN incorrectos." />,
};

export const Submitting: Story = {
  args: {
    brandName: 'COMMAND CENTER',
    brandLocation: 'PLATFORM · RESTOPSIQ ENTERPRISE',
    brandInitial: 'R',
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
