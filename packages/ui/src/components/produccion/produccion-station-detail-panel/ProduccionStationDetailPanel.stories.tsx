import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionStationDetailPanel } from './ProduccionStationDetailPanel';
const meta: Meta<typeof ProduccionStationDetailPanel> = {
  title: 'Produccion/ProduccionStationDetailPanel',
  component: ProduccionStationDetailPanel,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.stationPanel),
};
export default meta;
type Story = StoryObj<typeof ProduccionStationDetailPanel>;
export const Default: Story = {};
