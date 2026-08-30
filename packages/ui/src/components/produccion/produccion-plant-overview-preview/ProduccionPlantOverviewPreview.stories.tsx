import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionScreenDecorator, produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionPlantOverviewPreview } from './ProduccionPlantOverviewPreview';
const meta: Meta<typeof ProduccionPlantOverviewPreview> = {
  title: 'Produccion/ProduccionPlantOverviewPreview',
  component: ProduccionPlantOverviewPreview,
  ...produccionStoryMeta,
  decorators: [produccionScreenDecorator],
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.overviewPreview, '2096:109'),
};
export default meta;
type Story = StoryObj<typeof ProduccionPlantOverviewPreview>;
export const Default: Story = { args: { size: 'xl' } };
