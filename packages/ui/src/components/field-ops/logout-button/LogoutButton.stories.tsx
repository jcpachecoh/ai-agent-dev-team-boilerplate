import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { LogoutButton } from './LogoutButton';

const meta: Meta<typeof LogoutButton> = {
  title: 'Field Ops/LogoutButton',
  component: LogoutButton,
  ...fieldOpsStoryMeta,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Boton atomico para cerrar sesion en flujos Field Ops. Soporta modo completo (icono + texto) y modo icon-only.',
      },
    },
  },
  argTypes: {
    ...fieldOpsStoryMeta.argTypes,
    variant: {
      control: 'radio',
      options: ['default', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LogoutButton>;

export const Default: Story = {
  args: {
    variant: 'default',
    label: 'Salir',
  },
};

export const IconOnly: Story = {
  args: {
    variant: 'icon',
    label: 'Salir',
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    variant: 'default',
    theme: 'dark',
    label: 'Salir',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
      <LogoutButton {...args} size="sm" variant="default" />
      <LogoutButton {...args} size="md" variant="default" />
      <LogoutButton {...args} size="xl" variant="default" />
      <div style={{ display: 'flex', gap: 12 }}>
        <LogoutButton {...args} size="sm" variant="icon" />
        <LogoutButton {...args} size="md" variant="icon" />
        <LogoutButton {...args} size="xl" variant="icon" />
      </div>
    </div>
  ),
};
