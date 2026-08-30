import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { InventarioFormField } from '../inventario-form-field';
import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioModal } from './InventarioModal';

const modalFields = [
  'SKU',
  'Nombre',
  'Categoría',
  'Proveedor',
  'Precio Costo',
  'Precio Venta',
  'Stock Mínimo',
  'Stock Máximo',
];

const meta: Meta<typeof InventarioModal> = {
  title: 'Inventario/InventarioModal',
  component: InventarioModal,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.modal, '2075:1463'),
};

export default meta;
type Story = StoryObj<typeof InventarioModal>;

export const Default: Story = {
  args: {
    children: modalFields.map((label) => (
      <InventarioFormField key={label} label={label} inputType="input" />
    )),
  },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => <InventarioModal {...args} />,
  args: { ...Default.args, size: 'xl' },
};
