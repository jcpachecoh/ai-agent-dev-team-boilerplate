import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioDocumentTypeBadge } from './UsuarioDocumentTypeBadge';

const meta: Meta<typeof UsuarioDocumentTypeBadge> = {
  title: 'Usuario/UsuarioDocumentTypeBadge',
  component: UsuarioDocumentTypeBadge,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioDocumentTypeBadge>;

export const CC: Story = {
  args: { documentType: 'CC' },
};

export const Pasaporte: Story = {
  args: { documentType: 'PASAPORTE' },
};

export const Light: Story = {
  args: { documentType: 'NIT', theme: 'light' },
};
