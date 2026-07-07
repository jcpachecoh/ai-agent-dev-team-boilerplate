import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { FieldAlertBanner } from './FieldAlertBanner';

const meta: Meta<typeof FieldAlertBanner> = {
  title: 'Field Ops/FieldAlertBanner',
  component: FieldAlertBanner,
  ...fieldOpsStoryMeta,
  argTypes: {
    ...fieldOpsStoryMeta.argTypes,
    variant: {
      control: 'select',
      options: ['success', 'warning', 'danger', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FieldAlertBanner>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Nota operativa',
    children: 'Sistema operativo · Turno 1 · 06:00-14:00 · Bogotá',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Nota de seguridad alimentaria',
    children: 'No exceder 30 minutos de exposición a temperatura ambiente durante el porcionado.',
  },
};

export const Error: Story = {
  args: {
    variant: 'danger',
    title: 'Alerta',
    children: 'Tiempo estándar superado. Notificar al supervisor.',
  },
};

export const Dismissible: Story = {
  args: {
    ...Warning.args,
    dismissible: true,
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    ...Warning.args,
    theme: 'dark',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <FieldAlertBanner {...args} size="sm" />
      <FieldAlertBanner {...args} size="md" />
      <FieldAlertBanner {...args} size="xl" />
    </div>
  ),
  args: Warning.args,
};
