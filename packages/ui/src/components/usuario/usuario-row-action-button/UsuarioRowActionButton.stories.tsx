import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioRowActionButton } from './UsuarioRowActionButton';

const meta: Meta<typeof UsuarioRowActionButton> = {
  title: 'Usuario/UsuarioRowActionButton',
  component: UsuarioRowActionButton,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioRowActionButton>;

export const Edit: Story = {
  args: { variant: 'edit' },
};

export const Deactivate: Story = {
  args: { variant: 'deactivate' },
};

export const DeactivateDisabled: Story = {
  args: { variant: 'deactivate', disabled: true },
};

export const Light: Story = {
  args: { variant: 'edit', theme: 'light' },
};
