import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeUserAvatarGroup } from './SedeUserAvatarGroup';

const meta: Meta<typeof SedeUserAvatarGroup> = {
  title: 'Sede/SedeUserAvatarGroup',
  component: SedeUserAvatarGroup,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeUserAvatarGroup>;

export const ConUsuarios: Story = {
  args: {
    users: [
      {
        id: '1',
        name: 'Ana López',
        email: 'a@x.com',
        roleLabel: 'Operadora',
        initials: 'AL',
        tone: 'teal',
      },
      {
        id: '2',
        name: 'Roberto Silva',
        email: 'r@x.com',
        roleLabel: 'Operador',
        initials: 'RS',
        tone: 'coral',
      },
    ],
  },
};

export const SinUsuarios: Story = { args: { users: [] } };
