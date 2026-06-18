import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioPageSection } from './UsuarioPageSection';

const meta: Meta<typeof UsuarioPageSection> = {
  title: 'Usuario/UsuarioPageSection',
  component: UsuarioPageSection,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioPageSection>;

export const Default: Story = {
  args: {
    children: 'Contenido de sección',
    divider: true,
  },
};

export const Light: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};
