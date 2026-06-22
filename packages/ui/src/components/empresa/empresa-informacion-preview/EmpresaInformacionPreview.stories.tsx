import type { Meta, StoryObj } from '@storybook/react';

import { empresaStoryMeta } from '../shared/story-decorators';
import { EmpresaInformacionPreview } from './EmpresaInformacionPreview';

const meta: Meta<typeof EmpresaInformacionPreview> = {
  title: 'Empresa/Compositions/EmpresaInformacionPreview',
  component: EmpresaInformacionPreview,
  ...empresaStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmpresaInformacionPreview>;

export const VistaLectura: Story = {
  args: {
    onEditClick: () => undefined,
  },
};

export const ModoEdicion: Story = {
  args: {
    editing: true,
    onFieldChange: () => undefined,
  },
};

export const TemaClaro: Story = {
  args: {
    theme: 'light',
    onEditClick: () => undefined,
  },
};
