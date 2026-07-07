import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioRoleBadge } from './UsuarioRoleBadge';

const meta: Meta<typeof UsuarioRoleBadge> = {
  title: 'Usuario/UsuarioRoleBadge',
  component: UsuarioRoleBadge,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioRoleBadge>;

export const Owner: Story = {
  args: { label: 'Propietario', variant: 'owner' },
};

export const Supervisor: Story = {
  args: { label: 'Supervisor', variant: 'supervisor' },
};

export const Manager: Story = {
  args: { label: 'Manager', variant: 'manager' },
};

export const Default: Story = {
  args: { label: 'Operador', variant: 'default' },
};

export const Light: Story = {
  args: { label: 'Propietario', variant: 'owner', theme: 'light' },
};
