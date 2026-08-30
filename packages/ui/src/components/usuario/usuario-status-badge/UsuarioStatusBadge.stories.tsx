import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioStatusBadge } from './UsuarioStatusBadge';

const meta: Meta<typeof UsuarioStatusBadge> = {
  title: 'Usuario/UsuarioStatusBadge',
  component: UsuarioStatusBadge,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioStatusBadge>;

export const Active: Story = {
  args: { active: true },
};

export const Inactive: Story = {
  args: { active: false },
};

export const Light: Story = {
  args: { active: true, theme: 'light' },
};
