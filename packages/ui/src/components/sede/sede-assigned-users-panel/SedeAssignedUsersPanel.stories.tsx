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

export const WithAssign: Story = {
  args: {
    ...Default.args,
    assignableUsers: [
      { id: 'u3', label: 'Carlos Ruiz', hint: 'Supervisor' },
      { id: 'u4', label: 'María Gómez', hint: 'Operadora' },
    ],
    selectedUserId: 'u3',
    onAssignUser: () => undefined,
    onSelectedUserChange: () => undefined,
  },
};
