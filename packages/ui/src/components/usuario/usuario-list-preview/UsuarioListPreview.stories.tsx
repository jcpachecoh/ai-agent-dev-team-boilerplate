import type { Meta, StoryObj } from '@storybook/react';

import { UsuarioListPreview } from './UsuarioListPreview';

const meta: Meta<typeof UsuarioListPreview> = {
  title: 'Usuario/UsuarioListPreview',
  component: UsuarioListPreview,
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UsuarioListPreview>;

export const Dark: Story = {
  args: {
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: {
    theme: 'light',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#f6f4ef' }}>
        <Story />
      </div>
    ),
  ],
};

export const Playground: Story = {
  args: {
    theme: 'dark',
    searchValue: '',
    count: 14,
  },
  decorators: Dark.decorators,
};
