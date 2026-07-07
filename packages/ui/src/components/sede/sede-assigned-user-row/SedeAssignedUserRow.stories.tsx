import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeAssignedUserRow } from './SedeAssignedUserRow';

const meta: Meta<typeof SedeAssignedUserRow> = {
  title: 'Sede/SedeAssignedUserRow',
  component: SedeAssignedUserRow,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeAssignedUserRow>;

export const Default: Story = {
  args: {
    user: {
      id: 'u1',
      name: 'Ana López',
      email: 'a.lopez@palosdelena.com',
      roleLabel: 'Operadora',
      initials: 'AL',
      tone: 'teal',
    },
    onRemove: () => undefined,
  },
};
