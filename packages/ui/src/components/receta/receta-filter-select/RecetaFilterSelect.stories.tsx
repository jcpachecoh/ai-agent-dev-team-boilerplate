import type { Meta, StoryObj } from '@storybook/react';

import { RecetaFilterSelect } from './RecetaFilterSelect';

const meta: Meta<typeof RecetaFilterSelect> = {
  title: 'Receta/RecetaFilterSelect',
  component: RecetaFilterSelect,
  tags: ['autodocs'],
  args: {
    theme: 'dark',
    size: 'xl',
    options: [
      { value: 'all', label: 'Todas las categorias' },
      { value: 'entrada', label: 'Entrada' },
      { value: 'plato-fuerte', label: 'Plato Fuerte' },
      { value: 'postre', label: 'Postre' },
      { value: 'bebida', label: 'Bebida' },
    ],
    value: 'all',
  },
};

export default meta;

type Story = StoryObj<typeof RecetaFilterSelect>;

export const Default: Story = {};
