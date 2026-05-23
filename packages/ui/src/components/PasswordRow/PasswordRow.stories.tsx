import type { Meta, StoryObj } from '@storybook/react';

import { themeCanvas } from '../../../.storybook/canvas';
import PasswordRow from '.';

const meta: Meta<typeof PasswordRow> = {
  title: 'Atomos/PasswordRow',
  component: PasswordRow,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    size: 'md',
    label: 'Contraseña',
    actionText: '¿Olvidaste tu contraseña?',
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    label: { control: 'text' },
    actionText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordRow>;

/** Vista por defecto en Docs: una sola fila controlada por theme y size. */
export const Default: Story = {};
