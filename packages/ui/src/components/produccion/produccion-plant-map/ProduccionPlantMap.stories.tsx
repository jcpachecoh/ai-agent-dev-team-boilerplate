import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionScreenDecorator, produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPlantMap } from './ProduccionPlantMap';
const meta: Meta<typeof ProduccionPlantMap> = {
  title: 'Produccion/ProduccionPlantMap',
  component: ProduccionPlantMap,
  ...produccionStoryMeta,
  decorators: [produccionScreenDecorator],
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.plantMap, '2096:109'),
};
export default meta;
type Story = StoryObj<typeof ProduccionPlantMap>;
export const Default: Story = { args: { size: 'xl' } };
