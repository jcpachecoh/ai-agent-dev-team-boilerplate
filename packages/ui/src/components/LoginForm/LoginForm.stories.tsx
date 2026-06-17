import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Organisms/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <LoginForm
      onSubmit={async (data) => {
        // demo handler for storybook
        // eslint-disable-next-line no-console
        console.log('Login submit', data);
        return new Promise((r) => setTimeout(r, 800));
      }}
    />
  ),
};
