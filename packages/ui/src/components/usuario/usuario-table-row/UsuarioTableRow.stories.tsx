import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioTableRow } from './UsuarioTableRow';

const meta: Meta<typeof UsuarioTableRow> = {
  title: 'Usuario/UsuarioTableRow',
  component: UsuarioTableRow,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioTableRow>;

export const Default: Story = {
  args: {
    id: 'user-1',
    email: 'mes-owner@palos-de-lena.dev',
    cedula: '12345678',
    documentType: 'CC',
    roleName: 'Propietario',
    roleCode: 'OWNER',
    isActive: true,
    lastLoginAt: '2026-06-15T10:30:00.000Z',
  },
};

export const Inactive: Story = {
  args: {
    ...Default.args,
    id: 'user-2',
    email: 'manager@palos-de-lena.dev',
    roleName: 'Manager',
    roleCode: 'MANAGER',
    isActive: false,
    lastLoginAt: null,
  },
};

export const WithoutActions: Story = {
  args: {
    ...Default.args,
    showActions: false,
  },
};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
