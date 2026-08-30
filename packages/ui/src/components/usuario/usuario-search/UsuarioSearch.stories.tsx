import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioSearch } from './UsuarioSearch';

const meta: Meta<typeof UsuarioSearch> = {
  title: 'Usuario/UsuarioSearch',
  component: UsuarioSearch,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioSearch>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'mes-owner' },
};

export const Light: Story = {
  args: { theme: 'light' },
};
