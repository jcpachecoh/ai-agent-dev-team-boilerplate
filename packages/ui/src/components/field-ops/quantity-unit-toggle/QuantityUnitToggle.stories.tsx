import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { QuantityUnitToggle } from './QuantityUnitToggle';

const defaultOptions = [
  { value: 'kg', label: 'kg' },
  { value: 'un', label: 'un' },
];

const meta: Meta<typeof QuantityUnitToggle> = {
  title: 'Field Ops/QuantityUnitToggle',
  component: QuantityUnitToggle,
  ...fieldOpsStoryMeta,
  args: {
    options: defaultOptions,
    value: 'kg',
  },
};

export default meta;
type Story = StoryObj<typeof QuantityUnitToggle>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <QuantityUnitToggle {...args} size="sm" />
      <QuantityUnitToggle {...args} size="md" />
      <QuantityUnitToggle {...args} size="xl" />
    </div>
  ),
};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 'kg');
    return <QuantityUnitToggle {...args} value={value} onChange={setValue} />;
  },
};
