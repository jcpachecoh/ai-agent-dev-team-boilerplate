import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionScreenDecorator, produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPlantShell } from './ProduccionPlantShell';
const meta: Meta<typeof ProduccionPlantShell> = {
  title: 'Produccion/ProduccionPlantShell',
  component: ProduccionPlantShell,
  ...produccionStoryMeta,
  decorators: [produccionScreenDecorator],
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.plantShell, '2096:110'),
};
export default meta;
type Story = StoryObj<typeof ProduccionPlantShell>;
export const Default: Story = { args: { size: 'xl' } };
