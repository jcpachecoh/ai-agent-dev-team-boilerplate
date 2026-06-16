import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { RecetaTextInput } from '../../receta/receta-text-input/RecetaTextInput';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorProductModal } from './ProveedorProductModal';

const meta: Meta<typeof ProveedorProductModal> = {
  title: 'Proveedor/ProveedorProductModal',
  component: ProveedorProductModal,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { theme: 'dark', open: true },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ProveedorProductModal>;

const fields = (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    <div style={{ gridColumn: '1 / -1' }}>
      <RecetaTextInput placeholder="Nombre del Producto *" defaultValue="Lomo de Res Premium" />
    </div>
    <RecetaTextInput placeholder="SKU *" defaultValue="LRP-001" />
    <RecetaTextInput placeholder="Unidad *" defaultValue="Kg" />
    <RecetaTextInput placeholder="Precio (COP) *" defaultValue="28500" />
    <RecetaTextInput placeholder="MOQ *" defaultValue="5" />
    <div style={{ gridColumn: '1 / -1' }}>
      <RecetaTextInput placeholder="Estado *" defaultValue="Disponible" />
    </div>
  </div>
);

export const EditProduct: Story = {
  render: (args) => <ProveedorProductModal {...args}>{fields}</ProveedorProductModal>,
};

export const Saving: Story = {
  render: (args) => (
    <ProveedorProductModal {...args} saveLoading>
      {fields}
    </ProveedorProductModal>
  ),
};

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  render: (args) => (
    <ProveedorProductModal {...args} theme="dark">
      {fields}
    </ProveedorProductModal>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <ProveedorProductModal {...args} size="sm">
      {fields}
    </ProveedorProductModal>
  ),
};
