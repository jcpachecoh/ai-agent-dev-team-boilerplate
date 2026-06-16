import type { Meta, StoryObj } from '@storybook/react';

import { darkCanvas, lightCanvas } from '../../../.storybook/canvas';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atomos/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'cargar'],
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    arrow: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Iniciar Sesión',
    variant: 'primary',
    arrow: true,
  },
};

export const Secondary: Story = {
  args: {
    children: 'Cancelar',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    children: 'Eliminar',
    variant: 'danger',
  },
};

export const CargarLoading: Story = {
  args: {
    children: 'Cargando',
    variant: 'cargar',
    loading: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const ThemeOnDarkCanvas: Story = {
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button variant="primary" arrow>
        Primary
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="cargar" loading>
        Cargar
      </Button>
    </div>
  ),
};

export const ThemeOnLightCanvas: Story = {
  decorators: [lightCanvas],
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button variant="primary" arrow>
        Primary
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="cargar" loading>
        Cargar
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
};
