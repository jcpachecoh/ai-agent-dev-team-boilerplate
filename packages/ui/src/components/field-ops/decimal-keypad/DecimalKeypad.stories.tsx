import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { DecimalKeypad } from './DecimalKeypad';
import { QuantityInputDisplay } from '../quantity-input-display';

const meta: Meta<typeof DecimalKeypad> = {
  title: 'Field Ops/DecimalKeypad',
  component: DecimalKeypad,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof DecimalKeypad>;

export const Default: Story = {};

export const WithInput: Story = {
  render: (args) => {
    const [value, setValue] = React.useState('48.5');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <QuantityInputDisplay value={value || '0'} unit="kg" theme={args.theme} size={args.size} />
        <DecimalKeypad
          {...args}
          onKeyPress={(key) => {
            if (key === 'backspace') {
              setValue((v) => v.slice(0, -1));
            } else if (key === '.') {
              if (!value.includes('.')) setValue((v) => (v ? `${v}.` : '0.'));
            } else {
              setValue((v) => (v === '0' ? key : v + key));
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
      <DecimalKeypad {...args} size="sm" />
      <DecimalKeypad {...args} size="md" />
      <DecimalKeypad {...args} size="xl" />
    </div>
  ),
};
