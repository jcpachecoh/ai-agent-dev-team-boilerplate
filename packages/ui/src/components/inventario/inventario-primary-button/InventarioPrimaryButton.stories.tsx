import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioPrimaryButton } from './InventarioPrimaryButton';

const meta: Meta<typeof InventarioPrimaryButton> = {
  title: 'Inventario/InventarioPrimaryButton',
  component: InventarioPrimaryButton,
  ...inventarioStoryMeta,
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.primaryButton, '2075:1022'),
  argTypes: {
    variant: { control: 'select', options: ['primary', 'success', 'danger', 'ghost'] },
  },
};

export default meta;
type Story = StoryObj<typeof InventarioPrimaryButton>;

export const CrearProducto: Story = { args: { label: 'CREAR PRODUCTO', variant: 'primary' } };

export const GenerarReporte: Story = {
  args: { label: 'GENERAR REPORTE', variant: 'success', showIcon: false },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};
