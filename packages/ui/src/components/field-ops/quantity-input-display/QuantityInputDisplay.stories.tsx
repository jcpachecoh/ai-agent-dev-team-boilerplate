import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { QuantityInputDisplay } from './QuantityInputDisplay';

const meta: Meta<typeof QuantityInputDisplay> = {
  title: 'Field Ops/QuantityInputDisplay',
  component: QuantityInputDisplay,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof QuantityInputDisplay>;

export const Default: Story = {
  args: {
    value: '48.5',
    unit: 'kg',
    hint: 'Meta: 50.0 kg (-1.5 kg)',
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 420 }}
    >
      <QuantityInputDisplay {...args} size="sm" />
      <QuantityInputDisplay {...args} size="md" />
      <QuantityInputDisplay {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

export const Loading: Story = {
  args: { value: '—', loading: true },
};
