import type { Meta, StoryObj } from '@storybook/react';

import { themeCanvas } from '../../../.storybook/canvas';
import Switch from '.';

const meta: Meta<typeof Switch> = {
  title: 'Atomos/Switch',
  component: Switch,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    size: 'md',
    variant: 'default',
    checked: true,
    loading: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'success', 'danger', 'info'] },
    checked: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/** Vista por defecto en Docs: un solo switch controlado por theme y size. */
export const Default: Story = {};

export const Sizes: Story = {
  parameters: {
    docs: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 24 }}>
      <Switch theme="dark" size="sm" checked />
      <Switch theme="dark" size="md" checked />
      <Switch theme="dark" size="lg" checked />
    </div>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: { disable: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: 24,
        background: '#111',
      }}
    >
      <Switch theme="dark" variant="default" checked />
      <Switch theme="dark" variant="success" checked />
      <Switch theme="dark" variant="danger" checked />
      <Switch theme="dark" variant="info" checked />
      <Switch theme="dark" disabled />
      <Switch theme="dark" loading />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    loading: true,
    checked: true,
    theme: 'dark',
  },
};
