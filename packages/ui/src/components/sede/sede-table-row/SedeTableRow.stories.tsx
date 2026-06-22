import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeTableRow } from './SedeTableRow';

const meta: Meta<typeof SedeTableRow> = {
  title: 'Sede/SedeTableRow',
  component: SedeTableRow,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeTableRow>;

export const Activa: Story = {
  args: {
    name: 'Sede Bocagrande',
    isActive: true,
    assignedUsers: [
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

export const Inactiva: Story = {
  args: {
    isActive: false,
    name: 'Sede Centro',
  },
};
