import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionScreenDecorator, produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionStationsMasterPreview } from './ProduccionStationsMasterPreview';
const meta: Meta<typeof ProduccionStationsMasterPreview> = {
  title: 'Produccion/ProduccionStationsMasterPreview',
  component: ProduccionStationsMasterPreview,
  ...produccionStoryMeta,
  decorators: [produccionScreenDecorator],
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.stationsPreview, '2096:1343'),
};
export default meta;
type Story = StoryObj<typeof ProduccionStationsMasterPreview>;
export const Default: Story = { args: { size: 'xl' } };
