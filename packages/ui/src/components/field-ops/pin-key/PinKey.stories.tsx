import type { Meta, StoryObj } from '@storybook/react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { PinKey } from './PinKey';

const meta: Meta<typeof PinKey> = {
  title: 'Field Ops/PinKey',
  component: PinKey,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof PinKey>;

export const DefaultDigit: Story = {
  args: {
    value: '5',
    'aria-label': 'Tecla 5',
  },
};

export const EditableValue: Story = {
  args: {
    value: '•',
    'aria-label': 'Tecla personalizada',
  },
};

export const SemanticSuccess: Story = {
  args: {
    variant: 'semantic',
    accentColor: 'success',
    value: 'OK',
    'aria-label': 'Confirmar',
  },
};

export const SemanticWarning: Story = {
  args: {
    variant: 'semantic',
    accentColor: 'warning',
    value: '!',
    'aria-label': 'Advertencia',
  },
};

export const SemanticDanger: Story = {
  args: {
    variant: 'semantic',
    accentColor: 'danger',
    value: '⌫',
    'aria-label': 'Borrar',
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    value: '3',
    theme: 'dark',
    'aria-label': 'Tecla 3',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <PinKey {...args} size="sm" value="1" aria-label="Tecla 1 pequeña" />
      <PinKey {...args} size="md" value="1" aria-label="Tecla 1 mediana" />
      <PinKey {...args} size="xl" value="1" aria-label="Tecla 1 grande" />
    </div>
  ),
};
