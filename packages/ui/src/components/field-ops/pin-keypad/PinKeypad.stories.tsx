import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PinKeypad } from './PinKeypad';

const meta: Meta<typeof PinKeypad> = {
  title: 'Field Ops/PinKeypad',
  component: PinKeypad,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PinKeypad>;

export const Default: Story = {};

export const WithInput: Story = {
  render: (args) => {
    const [pin, setPin] = React.useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid #888',
                background: pin.length > i ? '#ccc' : 'transparent',
              }}
            />
          ))}
        </div>
        <PinKeypad
          {...args}
          onKeyPress={(key) => {
            if (key === 'backspace') {
              setPin((p) => p.slice(0, -1));
            } else if (key === 'confirm') {
              return;
            } else if (pin.length < 4) {
              setPin((p) => p + key);
            }
          }}
        />
      </div>
    );
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PinKeypad {...args} size="sm" />
      <PinKeypad {...args} size="md" />
      <PinKeypad {...args} size="xl" />
    </div>
  ),
};
