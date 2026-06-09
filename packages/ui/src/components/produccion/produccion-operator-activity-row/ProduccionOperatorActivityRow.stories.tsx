import type { Meta, StoryObj } from '@storybook/react';
import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionOperatorActivityRow } from './ProduccionOperatorActivityRow';
const meta: Meta<typeof ProduccionOperatorActivityRow> = {
  title: 'Produccion/ProduccionOperatorActivityRow',
  component: ProduccionOperatorActivityRow,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.operatorActivityRow),
};
export default meta;
type Story = StoryObj<typeof ProduccionOperatorActivityRow>;
export const Default: Story = {};
