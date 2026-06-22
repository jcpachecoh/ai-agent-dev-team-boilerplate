import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioTableCard } from './UsuarioTableCard';

const meta: Meta<typeof UsuarioTableCard> = {
  title: 'Usuario/UsuarioTableCard',
  component: UsuarioTableCard,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioTableCard>;

export const Default: Story = {
  args: {
    id: 'user-1',
    name: 'Juan Carlos Pérez',
    email: 'mes-owner@palos-de-lena.dev',
    cedula: '12345678',
    documentType: 'CC',
    roleName: 'Propietario',
    roleCode: 'OWNER',
    isActive: true,
    lastLoginAt: '2026-06-15T10:30:00.000Z',
  },
};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
