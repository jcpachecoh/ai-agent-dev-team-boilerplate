import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeUserSelect } from './SedeUserSelect';

const meta: Meta<typeof SedeUserSelect> = {
  title: 'Sede/SedeUserSelect',
  component: SedeUserSelect,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeUserSelect>;

export const Default: Story = {
  args: {
    options: [
      { id: 'u1', label: 'Carlos Mendoza', hint: 'Operator' },
      { id: 'u2', label: 'Daniel', hint: 'Manager' },
      { id: 'u3', label: 'Diego', hint: 'Administrador de Operaciones' },
    ],
    placeholder: 'Seleccionar usuario…',
  },
};
