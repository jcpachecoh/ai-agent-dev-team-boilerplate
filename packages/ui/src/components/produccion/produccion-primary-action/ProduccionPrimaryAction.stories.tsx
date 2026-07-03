import type { Meta, StoryObj } from '@storybook/react';

import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import {
  produccionDarkDecorator,
  produccionLightDecorator,
  produccionStoryMeta,
} from '../shared/story-decorators';
import { ProduccionPrimaryAction } from './ProduccionPrimaryAction';

const meta: Meta<typeof ProduccionPrimaryAction> = {
  title: 'Produccion/ProduccionPrimaryAction',
  component: ProduccionPrimaryAction,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.primaryAction, '2096:1438'),
};
export default meta;
type Story = StoryObj<typeof ProduccionPrimaryAction>;
export const NuevaEstacion: Story = { args: { label: 'NUEVA ESTACIÓN' } };
export const NuevaReceta: Story = { args: { label: 'NUEVA RECETA' } };
export const DarkMode: Story = { decorators: [produccionDarkDecorator], args: { theme: 'dark' } };
export const LightMode: Story = {
  decorators: [produccionLightDecorator],
  args: { theme: 'light' },
};
