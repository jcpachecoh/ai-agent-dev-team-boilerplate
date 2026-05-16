import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LoginFields } from './LoginFields';

const meta: Meta<typeof LoginFields> = {
  title: 'Molecules/LoginFields',
  component: LoginFields,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginFields>;

export const Default: Story = {
  args: {},
};
