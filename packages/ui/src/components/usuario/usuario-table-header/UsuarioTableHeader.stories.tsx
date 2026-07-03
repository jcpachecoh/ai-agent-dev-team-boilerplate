import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioTableHeader } from './UsuarioTableHeader';

const meta: Meta<typeof UsuarioTableHeader> = {
  title: 'Usuario/UsuarioTableHeader',
  component: UsuarioTableHeader,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioTableHeader>;

export const Default: Story = {};

export const WithoutActions: Story = {
  args: { showActions: false },
};

export const Light: Story = {
  args: { theme: 'light' },
};
