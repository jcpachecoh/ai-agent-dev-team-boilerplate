import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { RecetaFilterSelect } from '../../receta/receta-filter-select/RecetaFilterSelect';
import { RecetaTextInput } from '../../receta/receta-text-input/RecetaTextInput';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorProductModal } from './ProveedorProductModal';
import {
  ProveedorProductModalField,
  ProveedorProductModalFields,
} from './ProveedorProductModalFields';

const meta: Meta<typeof ProveedorProductModal> = {
  title: 'Proveedor/ProveedorProductModal',
  component: ProveedorProductModal,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { theme: 'dark', open: true, size: 'md' },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ProveedorProductModal>;

const fields = (
  <ProveedorProductModalFields>
    <ProveedorProductModalField
      fullWidth
      label="Nombre del Producto"
      htmlFor="productName"
      required
    >
      <RecetaTextInput id="productName" defaultValue="Lomo de Res Premium" />
    </ProveedorProductModalField>
    <ProveedorProductModalField label="SKU" htmlFor="sku" required>
      <RecetaTextInput id="sku" defaultValue="LRP-001" />
    </ProveedorProductModalField>
    <ProveedorProductModalField label="Unidad" htmlFor="unit" required>
      <RecetaTextInput id="unit" defaultValue="Kg" />
    </ProveedorProductModalField>
    <ProveedorProductModalField label="Precio (COP)" htmlFor="precio" required>
      <RecetaTextInput id="precio" defaultValue="28500" />
    </ProveedorProductModalField>
    <ProveedorProductModalField label="MOQ (Cantidad Mínima)" htmlFor="moq" required>
      <RecetaTextInput id="moq" defaultValue="5" />
    </ProveedorProductModalField>
    <ProveedorProductModalField fullWidth label="Estado" htmlFor="estado" required>
      <RecetaTextInput id="estado" defaultValue="Disponible" />
    </ProveedorProductModalField>
  </ProveedorProductModalFields>
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

export const WithSelects: Story = {
  render: (args) => (
    <ProveedorProductModal {...args}>
      <ProveedorProductModalFields>
        <ProveedorProductModalField
          fullWidth
          label="Nombre del Producto"
          htmlFor="productName"
          required
        >
          <RecetaTextInput id="productName" defaultValue="Lomo de Res Premium" />
        </ProveedorProductModalField>
        <ProveedorProductModalField label="SKU" htmlFor="sku" required>
          <RecetaTextInput id="sku" defaultValue="LRP-001" />
        </ProveedorProductModalField>
        <ProveedorProductModalField label="Unidad" htmlFor="unit" required>
          <RecetaFilterSelect
            id="unit"
            theme="dark"
            size="md"
            options={[
              { value: 'KILOGRAMS', label: 'Kg' },
              { value: 'UNIT', label: 'Unidad' },
            ]}
            value="KILOGRAMS"
          />
        </ProveedorProductModalField>
        <ProveedorProductModalField label="Precio (COP)" htmlFor="precio" required>
          <RecetaTextInput id="precio" defaultValue="28500" />
        </ProveedorProductModalField>
        <ProveedorProductModalField label="MOQ (Cantidad Mínima)" htmlFor="moq" required>
          <RecetaTextInput id="moq" defaultValue="5" />
        </ProveedorProductModalField>
        <ProveedorProductModalField fullWidth label="Estado" htmlFor="catalogStatus" required>
          <RecetaFilterSelect
            id="catalogStatus"
            theme="dark"
            size="md"
            options={[
              { value: 'available', label: 'Disponible' },
              { value: 'limited', label: 'Limitado' },
            ]}
            value="available"
          />
        </ProveedorProductModalField>
      </ProveedorProductModalFields>
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
