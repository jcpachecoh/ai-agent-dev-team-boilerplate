import type { Meta, StoryObj } from '@storybook/react';

import { RecetaTextInput } from '../../receta/receta-text-input/RecetaTextInput';
import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorFormSection } from './ProveedorFormSection';

const meta: Meta<typeof ProveedorFormSection> = {
  title: 'Proveedor/ProveedorFormSection',
  component: ProveedorFormSection,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorFormSection>;

const fields = (theme: 'light' | 'dark' = 'light') => (
  <>
    <RecetaTextInput placeholder="Razón Social *" theme={theme} />
    <RecetaTextInput placeholder="NIT *" theme={theme} />
    <RecetaTextInput placeholder="Categoría *" theme={theme} />
    <RecetaTextInput placeholder="Email *" theme={theme} />
  </>
);

export const GeneralInfo: Story = {
  render: (args) => (
    <ProveedorFormSection {...args} title="Información General">
      {fields(args.theme)}
    </ProveedorFormSection>
  ),
};

export const CommercialTerms: Story = {
  render: (args) => (
    <ProveedorFormSection {...args} title="Condiciones Comerciales">
      <RecetaTextInput placeholder="Condición de Pago *" theme={args.theme} />
      <RecetaTextInput placeholder="Lead Time Promedio" theme={args.theme} defaultValue="24h" />
    </ProveedorFormSection>
  ),
};

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  render: (args) => (
    <ProveedorFormSection {...args} theme="dark" title="Información General">
      {fields('dark')}
    </ProveedorFormSection>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProveedorFormSection {...args} size="sm">
        {fields(args.theme)}
      </ProveedorFormSection>
      <ProveedorFormSection {...args} size="xl">
        {fields(args.theme)}
      </ProveedorFormSection>
    </div>
  ),
};
