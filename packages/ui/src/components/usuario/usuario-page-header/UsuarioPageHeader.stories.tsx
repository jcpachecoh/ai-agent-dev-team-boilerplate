import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioPageHeader } from './UsuarioPageHeader';

const meta: Meta<typeof UsuarioPageHeader> = {
  title: 'Usuario/UsuarioPageHeader',
  component: UsuarioPageHeader,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioPageHeader>;

export const Default: Story = {};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
