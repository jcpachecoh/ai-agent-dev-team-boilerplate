import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionStationTableHeader } from './ProduccionStationTableHeader';
const meta: Meta<typeof ProduccionStationTableHeader> = {
  title: 'Produccion/ProduccionStationTableHeader',
  component: ProduccionStationTableHeader,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.stationHeader, '2096:1445'),
};
export default meta;
type Story = StoryObj<typeof ProduccionStationTableHeader>;
export const Default: Story = {};
