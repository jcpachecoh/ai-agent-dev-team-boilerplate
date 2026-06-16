import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeAssignedUsersPanel } from './SedeAssignedUsersPanel';

const meta: Meta<typeof SedeAssignedUsersPanel> = {
  title: 'Sede/SedeAssignedUsersPanel',
  component: SedeAssignedUsersPanel,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeAssignedUsersPanel>;

export const Default: Story = {
  args: {
    users: [
      {
        id: 'u1',
        name: 'Ana López',
        email: 'a.lopez@palosdelena.com',
        roleLabel: 'Operadora',
        initials: 'AL',
        tone: 'teal',
      },
      {
        id: 'u2',
        name: 'Roberto Silva',
        email: 'r.silva@palosdelena.com',
        roleLabel: 'Operador',
        initials: 'RS',
        tone: 'coral',
      },
    ],
    onRemoveUser: () => undefined,
  },
};
