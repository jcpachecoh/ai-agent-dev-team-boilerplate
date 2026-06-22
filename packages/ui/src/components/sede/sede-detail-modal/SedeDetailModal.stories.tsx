import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeDetailModal } from './SedeDetailModal';

const meta: Meta<typeof SedeDetailModal> = {
  title: 'Sede/SedeDetailModal',
  component: SedeDetailModal,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeDetailModal>;

const assignedUsers = [
  {
    id: 'u1',
    name: 'Ana López',
    email: 'a.lopez@palosdelena.com',
    roleLabel: 'Operadora',
    initials: 'AL',
    tone: 'teal' as const,
  },
  {
    id: 'u2',
    name: 'Roberto Silva',
    email: 'r.silva@palosdelena.com',
    roleLabel: 'Operador',
    initials: 'RS',
    tone: 'coral' as const,
  },
];

export const Default: Story = {
  args: {
    open: true,
    title: 'Consultar: Sede Bocagrande',
    locationId: 'sed-08',
    values: {
      name: 'Sede Bocagrande',
      address: 'Av. San Martín # 6-40',
      city: 'Cartagena',
      phone: '+57 605 901 2345',
      isActive: true,
    },
    assignedUsers,
    onClose: () => undefined,
    onEdit: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
    assignedUsers: [],
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    loadError: 'No se pudo cargar la información de la sede.',
    assignedUsers: [],
  },
};
