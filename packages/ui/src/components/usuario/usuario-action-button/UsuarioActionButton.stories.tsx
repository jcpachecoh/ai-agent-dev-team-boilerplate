import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioActionButton } from './UsuarioActionButton';

const meta: Meta<typeof UsuarioActionButton> = {
  title: 'Usuario/UsuarioActionButton',
  component: UsuarioActionButton,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioActionButton>;

export const Default: Story = {};

export const Light: Story = {
  args: { theme: 'light' },
};
