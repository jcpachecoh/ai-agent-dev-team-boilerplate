import type { Meta, StoryObj } from '@storybook/react';

import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioPageHeader } from '../usuario-page-header';
import { UsuarioPageSection } from '../usuario-page-section';
import { UsuarioPage } from './UsuarioPage';

const meta: Meta<typeof UsuarioPage> = {
  title: 'Usuario/UsuarioPage',
  component: UsuarioPage,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioPage>;

export const Default: Story = {
  render: (args) => (
    <UsuarioPage {...args}>
      <UsuarioPageSection theme={args.theme} divider variant="header">
        <UsuarioPageHeader theme={args.theme} size={args.size} />
      </UsuarioPageSection>
    </UsuarioPage>
  ),
};

export const Light: Story = {
  args: { theme: 'light' },
  render: Default.render,
};
