import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioActionButton } from '../usuario-action-button';
import { UsuarioListToolbar } from './UsuarioListToolbar';

const meta: Meta<typeof UsuarioListToolbar> = {
  title: 'Usuario/UsuarioListToolbar',
  component: UsuarioListToolbar,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioListToolbar>;

export const Default: Story = {
  args: {
    count: 14,
    searchValue: '',
    onSearchChange: () => undefined,
    primaryAction: <UsuarioActionButton />,
  },
};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
    primaryAction: <UsuarioActionButton theme="light" />,
  },
};
