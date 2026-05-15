import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Switch from '.';

const meta: Meta<typeof Switch> = {
  title: 'Atomos/Switch',
  component: Switch,
  tags: ['autodocs'],
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

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Switch {...args} />
    </div>
  ),
  args: {
    variant: 'default',
    checked: true,
    size: 'md',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Switch variant="default" checked />
      <Switch variant="success" checked />
      <Switch variant="danger" checked />
      <Switch variant="info" checked />
      <Switch disabled />
      <Switch loading />
    </div>
  ),
};
