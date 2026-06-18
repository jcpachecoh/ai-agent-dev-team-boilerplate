import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioModal } from './UsuarioModal';

const meta: Meta<typeof UsuarioModal> = {
  title: 'Usuario/UsuarioModal',
  component: UsuarioModal,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioModal>;

export const Default: Story = {
  args: {
    children: <p>Contenido del formulario</p>,
    footer: <button type="button">Guardar</button>,
  },
};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
