import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionOrderQueueRow } from './ProduccionOrderQueueRow';
const meta: Meta<typeof ProduccionOrderQueueRow> = {
  title: 'Produccion/ProduccionOrderQueueRow',
  component: ProduccionOrderQueueRow,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.orderQueueRow),
};
export default meta;
type Story = StoryObj<typeof ProduccionOrderQueueRow>;
export const Default: Story = {};
